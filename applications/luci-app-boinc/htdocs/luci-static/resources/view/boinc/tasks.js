'use strict';
'require ui';
'require fs';



Number.prototype.toHHMMSS = function () {
   var timeStr = '';

   if (this > 0) {
      var hours = Math.floor( this/3600 );
      var min = Math.floor( (this%3600)/60 );
      var sec = Math.floor( (this%3600)%60 );

      if (hours > 0) {
         timeStr = ((hours < 10) ? '0'+hours : hours)+':';
      }
      if (min > 0) {
         timeStr += ((min < 10) ? '0'+min : min)+':';
      }
      timeStr += (sec < 10) ? '0'+sec : sec;
   }    

   return timeStr;
}



function createTasksTableData(tblTasks, tasksJson) {
   for ( var i=0; i<tasksJson.length; i++ ) {
      var deadline = new Date(tasksJson[i].deadline*1000);
       
      var row = E('div', { 'class': 'tr data', 'id': tasksJson[i].id });
      row.appendChild(E('div', {'class': 'td project'}, tasksJson[i].project));
      row.appendChild(E('div', {'class': 'td progress'}, tasksJson[i].progress));
      row.appendChild(E('div', {'class': 'td status'}, tasksJson[i].status));
      row.appendChild(E('div', {'class': 'td elapsed'}, (tasksJson[i].elapsed).toHHMMSS()));
      row.appendChild(E('div', {'class': 'td remaining'}, (tasksJson[i].remaining).toHHMMSS()));
      row.appendChild(E('div', {'class': 'td deadline'}, deadline.toUTCString()));
      row.appendChild(E('div', {'class': 'td application'}, tasksJson[i].application));

      tblTasks.appendChild(row);
   }
}



return L.view.extend({
   load: function() {
      return L.resolveDefault(fs.exec_direct('/usr/bin/boinc-luci', ['get_tasks']));
   },

   render: function(tasks) {
      L.Poll.add(function() {
         return L.resolveDefault(fs.exec_direct('/usr/bin/boinc-luci', ['update_tasks'])).then(function(tasks) {
            var tasksJson = JSON.parse(tasks);
            var tblTasks = document.getElementById('tblTasks');
            var rows = tblTasks.getElementsByClassName('tr data');

            for (var i=0; i<rows.length; i++) {
               var jsonMatch = tasksJson.find(item => item.id == rows[i].id);
               if (jsonMatch != null) {
                  var deadline = new Date(jsonMatch.deadline*1000);

                  rows[i].getElementsByClassName('td progress')[0].innerText = jsonMatch.progress;
                  rows[i].getElementsByClassName('td status')[0].innerText = jsonMatch.status;
                  rows[i].getElementsByClassName('td elapsed')[0].innerText = (jsonMatch.elapsed).toHHMMSS();
                  rows[i].getElementsByClassName('td remaining')[0].innerText = (jsonMatch.remaining).toHHMMSS();
                  rows[i].getElementsByClassName('td deadline')[0].innerText = deadline.toUTCString();

                  tasksJson = tasksJson.filter(function(tasks) { return tasks.id != jsonMatch.id });
               }
               // Element not in the JSON, remove the entire row.
               else {
                  rows[i].remove();
               }

            }
            // Houston we have a Problem, there are items left in the JSON, so we need to perform a complete update.
            // Why this has to be so complicated? It's because of the way BOINC's GUI-interface works. You really
            // don't want to performe a hole client-request too often. Therefore we only do it when there are new Task.
            if ( tasksJson.length != 0 ) {
               fs.exec_direct('/usr/bin/boinc-luci', ['get_tasks']).then(function(tasks) {
                  var tasksJson = JSON.parse(tasks);
                  var tblTasks = document.getElementById('tblTasks');
                  var rows = tblTasks.getElementsByClassName('tr data');
                  
                  // it's probably the simplest to first remove all row's ...
                  while (rows[0]) {
                     rows[0].parentNode.removeChild(rows[0]);
                  }

                  // ... and then recreate the damn hole thing 
                  createTasksTableData(tblTasks, tasksJson); 
               });
            }

         });
      });

      var tasksJson = JSON.parse(tasks);

      var tblTasks = E('div', { 'class': 'table', 'id': 'tblTasks' },
                     [
                        E('div', { 'class': 'tr table-titles' },
                        [
                           E('div', { 'class': 'th' }, _('Project')),
                           E('div', { 'class': 'th' }, _('Progress')),
                           E('div', { 'class': 'th' }, _('Status')),
                           E('div', { 'class': 'th' }, _('Elapsed')),
                           E('div', { 'class': 'th' }, _('Remaining')),
                           E('div', { 'class': 'th' }, _('Deadline')),
                           E('div', { 'class': 'th' }, _('Application'))
                        ])
                     ]);


      createTasksTableData(tblTasks, tasksJson);

      return  [tblTasks]
   },
   handleSaveApply: null,
   handleSave: null,
   handleReset: null
});
