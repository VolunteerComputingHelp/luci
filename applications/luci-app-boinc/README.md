# luci-app-boinc

[BOINC](https://boinc.berkeley.edu) is a platform for volunteer computing, i.e. an infrastructure to distribute workunits to machines that are not centrally controlled. OpenWrt provides the package [boinc](https://github.com/openwrt/packages/tree/master/net/boinc) and, with it, the command line interface for the configuration. However, it spares the GUI that novices to BOINC are likely to expect. 

This package thus provides a web interface for the control and monitoring of the BOINC background application. It presents itself as a seamless extension of the LuCI web interface of OpenWrt.
