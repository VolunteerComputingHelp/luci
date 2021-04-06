#
# Copyright (C) 2020-2021 Christian Dreihsig <christian.dreihsig@t-online.de>
#
# This is free software, licensed under the GNU General Public License v3 or later.
# See /COPYING for more information.
#

include $(TOPDIR)/rules.mk

# set in luci.mk
#LUCI_TYPE:=app
#UCI_BASENAME:=boinc

LUCI_TITLE:=BOINC Configuration
LUCI_DEPENDS:=+luci-compat +boinc
PKG_BUILD_DEPENDS:=boinc
LUCI_PKGARCH:=all

PKG_LICENSE:=GPL-3+
PKG_MAINTAINER:=Christian Dreihsig <christian.dreihsig@t-online.de>
PKG_LICENSE:=GPL-3.0-or-later
PKG_LICENSE_FILES:=COPYING

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
