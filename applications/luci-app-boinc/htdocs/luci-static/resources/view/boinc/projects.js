'use strict';
'require ui';
'require fs';



function handleAction(ev, arg) {
   if (ev == 'uiModalProjects') {
      fetch('https://volunteercomputinghelp.github.io/OpenWrtProjects.json').then(function(info) {
         info.json().then(function(infoJson) {
            var mainSection = E('div', {'id': 'addProjectMainSection', 'style': 'height: 30em'}, [
               E('div', {'style': 'height: calc(100% - 71px); display: flex; border: 1px solid #ddd'}),
               E('div', {'style': 'height: 30px; bottom: 41px; border: 1px solid #ddd; margin-top: -1px'}),
               E('div', {'class': 'bottom', 'style': 'height: 41px; bottom: 0px'})
            ]);

            var leftSection = E('div', {'id': 'addProjectLeftSection', 'style': 'width:30%; overflow-y: auto; height: 100%; border-right:1px solid #ddd'});
            var rightSection = E('div', {'id': 'addProjectRightSection', 'style': 'width:79%; height: 100%; padding: 0px 10px 0px 10px;'}, [
               E('h5', {'id': 'projectName', 'class': 'center'}),
               E('p', {}, [
                  E('span', {'style': 'font-weight: bold; padding-right: 5px'}, _('Research area:')),
                  E('span', {'id': 'projectCategory'})
               ]),
               E('p', {}, [
                  E('span', {'style': 'font-weight: bold; padding-right: 5px'}, _('Organization:')),
                  E('span', {'id': 'projectOrganization'})
               ]),
               E('p', {}, [
                  E('div', {'style': 'font-weight: bold'}, _('Description:')),
                  E('span', {'id': 'projectDescription'})
               ])
            ]);

            var urlSection = E('div', {'style': 'display: flex; bottom:0px; width: 100%; height: 30px' }, [
               E('label', {'style': 'line-height: 31px; float: left; white-space: nowrap; padding: 0px 10px 0px 10px; font-weight: bold'}, _('Project URL:')),
               E('input', {'id': 'projectUrl', 'style': 'width: 100%; margin-top: -1px', 'spellcheck': 'false'})
            ]);

            var buttonSection = E('div', {'class': 'right', 'style': 'padding-top: 11px; height: 41px'}, [
               E('button', {'class': 'btn', 'click': L.hideModal}, _('Cancel')),
               ' ',
               E('button', { 'class': 'btn cbi-button-action',
                             'click': ui.createHandlerFn(this, function() { return handleAction('enterCreditals'); } )
               }, _('Next...'))
            ]);


            var tblProjects = E('div', {'class': 'table cbi-section-table' ,'style': 'width: 100%; margin-top: -1px'});
            for (var i=0; i<infoJson.length; i++) {
               var name = infoJson[i].name;
               var organization = infoJson[i].organization;
               var category = infoJson[i].category;
               var URL = infoJson[i].URL;
               var description = infoJson[i].description;

               tblProjects.appendChild(E('div', {'class': 'tr'}, [
                  E('div', {'class': 'td', 'id': 'project'+i,
                            'data-category': category, 'data-organization': organization, 'data-url': URL, 'data-description': description,
                            'click': ui.createHandlerFn(this, function(idx) { return handleAction('selectProject', idx); }, i) 
                           }, _(name))
               ]));
            }
            leftSection.appendChild(tblProjects);

            (mainSection.getElementsByTagName('div'))[2].append(buttonSection);
            (mainSection.getElementsByTagName('div'))[1].append(urlSection);
            (mainSection.getElementsByTagName('div'))[0].append(leftSection);
            (mainSection.getElementsByTagName('div'))[0].append(rightSection);

            L.ui.showModal(_('Add new Project'), mainSection);

            handleAction('selectProject', 0);
         });
      });
   }
   else if (ev == 'selectProject') {
      var listElement, idx = 0;
      while (listElement = document.getElementById('project'+idx)) {
         listElement.removeAttribute('style');
         idx++;
      }

      var selectedElement = document.getElementById('project'+arg);
      selectedElement.style.backgroundColor = '#b0d0f0';

      document.getElementById('projectName').innerText = selectedElement.innerText;
      document.getElementById('projectCategory').innerText = selectedElement.dataset.category;
      document.getElementById('projectOrganization').innerText = selectedElement.dataset.organization;
      document.getElementById('projectDescription').innerText = selectedElement.dataset.description;
      document.getElementById('projectUrl').value = selectedElement.dataset.url;

   }
   else if (ev == 'enterCreditals') {
      var projectUrl = (document.getElementById('projectUrl')).value;
      fs.exec_direct('/usr/bin/boinc-luci', ['request_project', projectUrl]).then(function(project) {
         var projectJson = JSON.parse(project);

         if (projectJson.state == 0) {
            var projectName = projectJson.name;
            projectUrl = projectJson.url;
      
            var mainSection = document.getElementById('addProjectMainSection');
            mainSection.innerHTML = '';
            mainSection.appendChild( E('div', {'class': 'center', 'style': 'height: 40px'}, [
               E('h5', {}, _('Identify your account at ' + projectName)) 
            ]));

            var loginMask = E('div', {'class': 'center', 'style': 'height: calc(100% - 82px); padding-top: 5em'}, [
               E('div', {'class': 'cbi-value', 'style': 'padding-top:.5em'}, [
                  E('label', {'class': 'cbi-value-title'}, [_('Email address: ')]),
                  E('div', {'class': 'cbi-value-field'}, [
                     E('input', {'class': 'cbi-input-text', 'spellcheck': 'false', 'id': 'email'}),
                  ])
               ]),
               E('div', {'class': 'cbi-value', 'style': 'padding-top: .5em'}, [
                  E('label', {'class': 'cbi-value-title'}, [_('Password: ')]),
                  E('div', {'class': 'cbi-value-field'}, [
                     E('input', {'class': 'cbi-input-text', 'type': 'password', 'id': 'password'})
                  ])
               ])
            ]);

            var buttonSection = E('div', {'class': 'bottom', 'style': 'height: 41px; bottom: 0px'}, [
               E('div', {'class': 'right', 'style': 'padding-top: 11px'}, [
               E('button', {'class': 'btn', 'click': L.hideModal}, _('Cancel')),
                  ' ',
                  E('button', { 'class': 'btn cbi-button-save',
                                'click': ui.createHandlerFn(this, function() { return handleAction('attachProject', projectUrl); } )
                  }, _('Finish'))
               ])
            ]);



            mainSection.appendChild(loginMask);
            mainSection.appendChild(buttonSection);
         }
         else {
            if (projectJson.state == -224) {
               window.alert("Can't connect to: " + projectUrl + "\n\nMaybe the Project is temporarily unavailable or you provided a wrong URL");
            }
            else {
               window.alert("A Error occurred while trying to connect to: " + projectUrl);
            }
         }
      });
   }
   else if (ev == 'attachProject') {
      var URL = arg;
      var email = document.getElementById('email').value;
      var password = document.getElementById('password').value;

      fs.exec_direct('/usr/bin/boinc-luci', ['attach_project', URL, email, password]).then(function(retVal) {
         var statusJson = JSON.parse(retVal);

         if (statusJson.state == 0) {
            L.hideModal();
            location.reload();
         }
         else if (statusJson.state == -136) {
            window.alert("Wrong Email address provided!\n\nPlease check the email address you entered.");
         }
         else if (statusJson.state == -206) {
            window.alert("Wrong password!\n\nPlease check the password you entered.");
         }
         else {
            window.alert("A unknown Error occured!\n\nPlease try again later.");
         }
      });


   }
}



return L.view.extend({
   load: function() {
      return L.resolveDefault(fs.exec_direct('/usr/bin/boinc-luci', ['get_projects']));
   },

   render: function(projects) {
      var projectsJson = JSON.parse(projects);
      var buttonAddProject = E('div', {'class': 'right'}, [ 
                                E('button', {
                                   'class': 'cbi-button cbi-button-apply',
                                   'click': ui.createHandlerFn(this, function() { return handleAction('uiModalProjects', null); })
                                }, [_('Add Project...')])
                             ]);

      var tblProjects = ( E('div', {'class': 'table', 'id': 'tblProjects'}, [
                             E('div', {'class': 'tr table-titles'}, [
                                E('div', {'class': 'th'}, _('Project')),
                                E('div', {'class': 'th'}, _('Account')),
                                E('div', {'class': 'th'}, _('Team')),
                                E('div', {'class': 'th'}, _('Work done')),
                                E('div', {'class': 'th'}, _('Avg. work done')),
                                E('div', {'class': 'th'}, _('Resource share'))
                             ])
                          ])
                       );

      var resShareSum=0;
      for (var i=0; i<projectsJson.length; i++) {
         resShareSum += projectsJson[i].res_share;
      }

      for (var i=0; i<projectsJson.length; i++) {
         var resSharePercent = (projectsJson[i].res_share/resShareSum)*100;

         var row = E('div', {'class': 'tr'}, [
                      E('div', {'class': 'td project'}, projectsJson[i].name),
                      E('div', {'class': 'td user'}, projectsJson[i].user),
                      E('div', {'class': 'td team'}, projectsJson[i].team),
                      E('div', {'class': 'td credit'}, (projectsJson[i].credit).toLocaleString('en-US')),
                      E('div', {'class': 'td avg_credit'}, (projectsJson[i].avg_credit).toLocaleString('en-US')),
                      E('div', {'class': 'td res_share'}, projectsJson[i].res_share+' ('+resSharePercent+'%)'),
                   ]);
         tblProjects.append(row);
      }
                               

      return  [tblProjects, buttonAddProject];
   },
   handleSaveApply: null,
   handleSave: null,
   handleReset: null
});
