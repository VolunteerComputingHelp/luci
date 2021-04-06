module("luci.controller.boinc", package.seeall)

function index()
	entry({"admin", "services", "boinc"}, firstchild(), _("Boinc"), 90)
	entry({"admin", "services", "boinc", "projects"}, view("boinc/projects"), _("Projects"), 1)
	entry({"admin", "services", "boinc", "tasks"}, view("boinc/tasks"), "Tasks", 2)
	entry({"admin", "services", "boinc", "statistics"}, view("boinc/statistics"), "Statistics", 3)
end
