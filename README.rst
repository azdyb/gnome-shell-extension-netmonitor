What is NetMonitor?
===================

NetMonitor is a humble Netspeed_ replacement for gnome-shell_.

.. _Netspeed: http://projects.gnome.org/netspeed/
.. _gnome-shell: https://live.gnome.org/GnomeShell

What it looks like?
===================

Everybody loves screenshots, right?

.. image:: http://img197.imageshack.us/img197/883/netmonitor.png
   :alt: Normal view

.. image:: http://img339.imageshack.us/img339/4089/netmonitormenu.png
   :alt: Menu

.. image:: http://img225.imageshack.us/img225/7882/netmonitortooltip.png
   :alt: Tooltip


Disclaimer
==========

As I couldn't find any real documentation for writing gnome-shell extensions, I based my code on better or worse snippets and tutorials found on internet. Some of the sources are mentioned below:

* `gnome-shell-extensions <http://git.gnome.org/browse/gnome-shell-extensions/>`_
* `Musings of an OS plumber <http://blog.fpmurphy.com/tag/gnome-shell>`_
* `gnome-shell-system-monitor-applet <https://github.com/paradoxxxzero/gnome-shell-system-monitor-applet>`_


How it works?
=============

The extension lists available network devices using NMClient and then parses /proc/net/dev file for interfaces' statistics.

I should have used imports.gi.GTop instead of parsing /proc/net/dev/, but I don't believe it's supported in gnome-shell 3.0.


Instalation
===========

In order to install gsettings schema, copy org.gnome.shell.extensions.net-monitor.gschema.xml file to /usr/share/glib-2.0/schemas and invoke glib-compile-schemas on that direcory. Note that you need to be root or use sudo to do that::
  
  # cp org.gnome.shell.extensions.net-monitor.gschema.xml /usr/share/glib-2.0/schemas
  # glib-compile-schemas /usr/share/glib-2.0/schemas
  
The NetMonitor@zdyb.tk directory should be copied to /usr/share/gnome-shell/extensions or ~/.local/share/gnome-shell/extensions/::

  # cp NetMonitor\@zdyb.tk /usr/share/gnome-shell/extensions
  
or::

  $ cp NetMonitor\@zdyb.tk ~/.local/share/gnome-shell/extensions/
  
  
License
=======

Copyright 2011 Aleksander Zdyb

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program.  If not, see http://www.gnu.org/licenses/.
