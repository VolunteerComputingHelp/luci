
CPPFLAGS+=-I../../boinc-client_release-7.16-7.16.16/ -I../../boinc-client_release-7.16-7.16.16/ipkg-install/usr/include/
#CXXFLAGS+= -g

boinc-luci: main.cpp
	echo -n "PWD="; pwd
	echo -n "CURDIR=$(CURDIR)"
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) $(LDFLAGS) -o boinc-luci main.cpp -L../../boinc-client_release-7.16-7.16.16/lib -lboinc

compile: boinc-luci

install: compile
	mkdir -p $(DESTDIR)/usr/bin
	cp boinc-luci $(DESTDIR)/usr/bin/

clean:
	rm -f boinc-luci

.PHONY: compile clean install
