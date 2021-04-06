#include "lib/gui_rpc_client.h"
#include "lib/error_numbers.h"
#include "lib/util.h"

#include <iostream>
#include <time.h>
#include <sstream>
#include <unistd.h>

using namespace std;

const string taskStates[] = {"New", "Downloading", "Ready to start", "Compute error", "Uploading", "Ready to report", "Aborted", "Upload failed"};
const string activeTaskStates[] = {"Ready to start", "Running", "Exited", "Signaled", "Failed", "Aborted", "Coudn't start", "Exiting", "Suspended", "Downloading"};

ostringstream attachProject(RPC_CLIENT* rpc, const char* url, const char* user, const char* pw) {
   ostringstream retVal;
   retVal << "{\"state\": ";

   ACCOUNT_IN accIn;
   ACCOUNT_OUT accOut;

   accIn.url = url;
   accIn.email_addr = user;
   accIn.passwd = pw;

   if (!rpc->lookup_account(accIn)) {
      // Wait for Boinc-client to contact project-server
      int pollStatus = 1;
      while(pollStatus) {
         if (!rpc->lookup_account_poll(accOut)) {
            if (accOut.error_num == ERR_IN_PROGRESS) {
               boinc_sleep(1);
            }
            else {
               pollStatus = 0;
            }
         }
         else {
            pollStatus = 0;
         }
      }

      // success: try to attach to Project
      if (accOut.error_num == BOINC_SUCCESS) {
         int attachReturnState = rpc->project_attach(url, accOut.authenticator.c_str(), ""); 

         if ( attachReturnState == BOINC_SUCCESS ) {
            retVal << BOINC_SUCCESS;
         }
     }
     else {
        retVal << accOut.error_num;
     }
   

   }
   else {
      retVal << 1;
   }

   retVal << "}\n";

   return retVal;
}

ostringstream getProjects(RPC_CLIENT* rpc) {
   ostringstream retVal;

   CC_STATE state;
   if (!rpc->get_state(state)) {
      retVal << "[\n";
 
      for (vector<PROJECT*>::iterator it = state.projects.begin(); it != state.projects.end(); it++) {
         ostringstream status;
         if ( (*it)->suspended_via_gui ) {
            status << "Suspended by user; ";
         }
         if ( (*it)->dont_request_more_work ) {
            status << "Won't get new tasks; ";
         }
         if ( (*it)->ended ) {
            status << "Project ended; "; //Let's hope we have to never display that :(
         }
         if ( (*it)->detach_when_done ) {
            status << "Will removed when tasks done; "; // And this too :(
         }
         if ( (*it)->sched_rpc_pending ) {
            status << "Scheduler request pending; ";
         }
         if ( (*it)->scheduler_rpc_in_progress ) {
            status << "Scheduler request in progress; ";
         }

         retVal << "{\n";
         retVal << "\"name\": \"" << (*it)->project_name << "\",\n";
         retVal << "\"user\": \"" << (*it)->user_name << "\",\n";
         retVal << "\"team\": \"" << (*it)->team_name << "\",\n";
         retVal << "\"credit\": " << (*it)->user_total_credit << ",\n";
         retVal << "\"avg_credit\": " << (*it)->user_expavg_credit << ",\n";
         retVal << "\"res_share\": " << (*it)->resource_share << ",\n";
         retVal << "\"status\": \"" << status.str() << "\"\n";
         retVal << "}";
         if (next(it) != state.projects.end())
            retVal << ",";
         retVal << "\n";
      }
      retVal << "]\n";
   }

   return retVal;
}

ostringstream getStatistics(RPC_CLIENT* rpc) {
   ostringstream retVal;

   PROJECTS projects;
   if (!rpc->get_statistics(projects)) {

      CC_STATE state;
      if (!rpc->get_state(state)) {
         retVal << "[\n";
         for(vector<PROJECT*>::iterator itPro = projects.projects.begin(); itPro != projects.projects.end(); itPro++) {
            
            // fill in Project Name
            vector<PROJECT*>::iterator itState = state.projects.begin();
            while ( (strcmp((*itState)->master_url, (*itPro)->master_url) != 0) && (itState != state.projects.end()) ) {
               itState++;
            }
            retVal << "{\n\"name\": \"" << (*itState)->project_name << "\",\n";

            // getting the statistic data
            ostringstream userTotal, userAvg, hostTotal, hostAvg, date;
            for(vector<DAILY_STATS>::iterator itStats = (*itPro)->statistics.begin(); itStats != (*itPro)->statistics.end(); itStats++) {
               userTotal << itStats->user_total_credit;
               userAvg << itStats->user_expavg_credit;
               hostTotal << itStats->host_total_credit;
               hostAvg << itStats->host_expavg_credit;
               date << (time_t)itStats->day;
               
               if ( next(itStats) != ((*itPro)->statistics.end()) ) {
                  userTotal << ",";
                  userAvg << ",";
                  hostTotal << ",";
                  hostAvg << ",";
                  date << ",";
               } 
            }

            retVal << "\"date\": [" << date.str() << "],\n";
            retVal << "\"userTotal\": [" << userTotal.str() << "],\n";
            retVal << "\"userAvg\": [" << userAvg.str() << "],\n";
            retVal << "\"hostTotal\": [" << hostTotal.str() << "],\n";
            retVal << "\"hostAvg\": [" << hostAvg.str() << "]\n";

            retVal << "}";
            if ( next(itPro) != projects.projects.end())
               retVal << ",";
            retVal << "\n";
         }
   
         retVal << "]\n";
      }

   }
 
   return retVal;
}

ostringstream requestProject(RPC_CLIENT* rpc, string url) {
   ostringstream retVal;

   PROJECT_CONFIG project;

   if (!rpc->get_project_config(url)) {
      int pollStatus = 1;
      while(pollStatus) {
         if (!rpc->get_project_config_poll(project)) {
            if (project.error_num == ERR_IN_PROGRESS) {
               boinc_sleep(1);
            }
            else {
               pollStatus = 0;
            }
         }
         else {
            pollStatus = 0;
         }
      }

      retVal << "{\n";
      retVal << "\"state\": " << project.error_num;
      if (project.error_num == BOINC_SUCCESS) {
         retVal << ",\n";
         retVal << "\"name\": \"" << project.name << "\",\n";
         retVal << "\"url\": \"" << project.web_rpc_url_base << "\"\n";
      }
      retVal << "}";
   }

   return retVal;
}

ostringstream getTasks(RPC_CLIENT* rpc) {
   ostringstream retVal;

   CC_STATE state;
   if (!rpc->get_state(state)) {
      RESULTS results;
      results.results = state.results;

      retVal << "[\n";

      for (vector<RESULT*>::iterator it = results.results.begin(); it != results.results.end(); it++) {
         // merge state and active_task_state into one string output
         int taskState = (*it)->state;
         string taskStateString = taskStates[taskState];
         if (taskState == 2) {
            taskStateString = activeTaskStates[(*it)->active_task_state];
         }

         retVal << "{\n";
         retVal << "\"id\": \"" << (*it)->name << "\",\n";
         retVal << "\"project\": \"" << (*it)->project->project_name << "\",\n";
         retVal << "\"progress\": \"" << ((*it)->fraction_done * 100) << " %\",\n";
         retVal << "\"status\": \"" << taskStateString << "\",\n";
         retVal << "\"elapsed\": " << (*it)->elapsed_time << ",\n";
         retVal << "\"remaining\": " << (*it)->estimated_cpu_time_remaining << ",\n";
         retVal << "\"deadline\": \"" << (time_t)((*it)->report_deadline) << "\",\n";
         retVal << "\"application\": \"" << (*it)->app->user_friendly_name << " " << (*it)->avp->version_num/100 << "." << (*it)->avp->version_num%100 << "\"\n";
         retVal << "}";
         if (next(it) != results.results.end())
            retVal << ",";
         retVal << "\n";
      }
      retVal << "]\n";
   }

   return retVal;
}

ostringstream updateTasks(RPC_CLIENT* rpc) {
   ostringstream retVal;

   RESULTS results;
   if ( !rpc->get_results(results) ) {
      
      retVal << "[\n";
      for (vector<RESULT*>::iterator it = results.results.begin(); it != results.results.end(); it++) {
         // merge state and active_task_state into one string output
         int taskState = (*it)->state;
         string taskStateString = taskStates[taskState];
         if (taskState == 2) {
            taskStateString = activeTaskStates[(*it)->active_task_state];
         }

         retVal << "{\n";
         retVal << "\"id\": \"" << (*it)->name << "\",\n";
         retVal << "\"progress\": \"" << ((*it)->fraction_done * 100) << " %\",\n";
         retVal << "\"status\": \"" << taskStateString << "\",\n";
         retVal << "\"elapsed\": " << (*it)->elapsed_time << ",\n";
         retVal << "\"remaining\": " << (*it)->estimated_cpu_time_remaining << ",\n";
         retVal << "\"deadline\": \"" << (time_t)((*it)->report_deadline) << "\"\n";
         retVal << "}";
         if (next(it) != results.results.end())
            retVal << ",";
         retVal << "\n";
      }
      retVal << "]\n";
   }

   return retVal;
}

int main(int argc, char** argv) {
   RPC_CLIENT rpc;
   char passwd_buf[256];

   safe_strcpy(passwd_buf, "");

   rpc.init(NULL);

   read_gui_rpc_password(passwd_buf);
   if ( strlen(passwd_buf) > 0 ) {
      rpc.authorize((const char*)passwd_buf);
   }
   else {
      chdir("/opt/boinc/");
      read_gui_rpc_password(passwd_buf);
      if (strlen(passwd_buf) > 0) {
         rpc.authorize((const char*)passwd_buf);
      }
   }

   if ( argc > 1 ) {
      if ( strcmp(argv[1], "get_projects") == 0 ) {
         cout << getProjects(&rpc).str();
      }
      else if ( strcmp(argv[1], "request_project") == 0 ) {
         if ( argc == 3 ) {
            cout << requestProject( &rpc, string(argv[2], strlen(argv[2])) ).str();
         }
      }
      else if ( strcmp(argv[1], "get_tasks") == 0 ) {
         cout << getTasks(&rpc).str();
      }
      else if ( strcmp(argv[1], "update_tasks") == 0 ) {
         cout << updateTasks(&rpc).str();
      }
      else if ( strcmp(argv[1], "attach_project") == 0 ) {
         if ( argc == 5 ) {
            cout << attachProject(&rpc, argv[2], argv[3], argv[4]).str();
         }
      } 
      else if ( strcmp(argv[1], "get_statistics") == 0 ) {
         cout << getStatistics(&rpc).str();
      }
   }

   return 0;
}
