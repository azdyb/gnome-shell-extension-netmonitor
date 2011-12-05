What is NetMonitor?
===================

NetMonitor is a humble Netspeed_ replacement for gnome-shell_.

.. _Netspeed: http://projects.gnome.org/netspeed/
.. _gnome-shell: https://live.gnome.org/GnomeShell

What it looks like?
===================

Everybody loves screenshots, right?

.. image:: http://img848.imageshack.us/img848/883/netmonitor.png
   :alt: Normal view

.. image:: http://img11.imageshack.us/img11/4089/netmonitormenu.png
   :alt: Menu


Disclaimer
==========

As I couldn't find any real documentation for writing gnome-shell extensions, I based my code on better or worse snippets and tutorials found on internet. Some of the sources are mentioned below:

* `gnome-shell-extensions <http://git.gnome.org/browse/gnome-shell-extensions/>`_
* `Musings of an OS plumber <http://blog.fpmurphy.com/tag/gnome-shell>`_
* `gnome-shell-system-monitor-applet <https://github.com/paradoxxxzero/gnome-shell-system-monitor-applet>`_


How it works?
=============

The extension lists available network devices using NMClient and uses GTop to get devices' statistics.


Instalation
===========
  
The NetMonitor@zdyb.tk directory should be copied to /usr/share/gnome-shell/extensions or ~/.local/share/gnome-shell/extensions/::

  # cp -r NetMonitor\@zdyb.tk /usr/share/gnome-shell/extensions
  
or::

  $ cp -r NetMonitor\@zdyb.tk ~/.local/share/gnome-shell/extensions/
  
  
License
=======

Copyright 2011 Aleksander Zdyb

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program.  If not, see http://www.gnu.org/licenses/.
