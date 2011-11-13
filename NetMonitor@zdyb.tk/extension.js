 /*
  * Copyright 2011 Aleksander Zdyb
  *
  * This program is free software: you can redistribute it and/or modify
  * it under the terms of the GNU General Public License as published by
  * the Free Software Foundation, either version 3 of the License, or
  * (at your option) any later version.
  * 
  * This program is distributed in the hope that it will be useful,
  * but WITHOUT ANY WARRANTY; without even the implied warranty of
  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  * GNU General Public License for more details.
  * 
  * You should have received a copy of the GNU General Public License
  * along with this program.  If not, see <http://www.gnu.org/licenses/>.
  */

const St = imports.gi.St;
const Mainloop = imports.mainloop;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const DBus = imports.dbus;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Gettext = imports.gettext;
const MessageTray = imports.ui.messageTray;
const Tweener = imports.tweener.tweener;
const Clutter = imports.gi.Clutter;
const GTop = imports.gi.GTop;

const NetworkManager = imports.gi.NetworkManager;
const NMClient = imports.gi.NMClient;

const _ = Gettext.gettext;

const UPDATE_INTERVAL = 2000;
const GSETTINGS_SCHEMA = 'org.gnome.shell.extensions.net-monitor';

const settings = new Gio.Settings({ schema: GSETTINGS_SCHEMA });


let net_speed;


/** Holds almost all information about network interface.
 *  It also builds and updates GUI
 */

/**
 * @todo Move it to separate file
 */
function NetInterface(nmdevice) {
  this._init(nmdevice);
};

NetInterface.prototype = {
  is_active: false,     // Is connected ?
  is_hidden: false,     // Should show on panel? 
  onoff_menu: null,     // Switcher toggling "show" attribute 
  nmdevice: null,
  if_name: "",
  ip4: null,
  netload: null,
  device_type: NetworkManager.DeviceType.UNKNOWN,
  signal_strength: 0,
  
  _init: function(nmdevice) {
    this.nmdevice = nmdevice;
    this.netload = new GTop.glibtop_netload();
    this.device_type = this.nmdevice.get_device_type();
    // TODO: Add 3G, Bluetooth and so on...
    let icon_name;
    
    switch(this.device_type) {
      case NetworkManager.DeviceType.ETHERNET:
        icon_name = "network-wired";
        break;
      case NetworkManager.DeviceType.WIFI:
        icon_name = "network-wireless-connected";
        break;
      default:
        icon_name = "network-wired";
        break;
    };
    
    this.icon = new St.Icon({
      icon_type: St.IconType.SYMBOLIC,
      style_class: "popup-menu-icon",
      icon_name: icon_name
    });
    
    this.box = new St.BoxLayout();
    this.box.add_actor(this.icon);
    
    this.label_in = new St.Label({ style_class: "bandwidth-label", text: "---" });
    this.label_out = new St.Label({ style_class: "bandwidth-label", text: "---" });
    
    this.box.add_actor(this.label_in);
    this.box.add_actor(this.label_out);
    
    this.bytes_in = 0;
    this.bytes_out = 0;
    this.last_probe_time = 0;
    
    this.speed_in = 0;
    this.speed_out = 0;
    
    this.UpdateProperties();
  },
  
  UpdateProperties: function() {
    this.if_name = this.nmdevice.get_iface();
    let ip4_config = this.nmdevice.get_ip4_config();
    
    if (ip4_config != null) {
      let addresses = [];
      
      for each (let addr in ip4_config.get_addresses()) {    
        let ip_uint32 = addr.get_address();
        let ip = [];
        
        for (let i=0; i<4; ++i)
          ip.push(ip_uint32 >> i*8 & 0xFF);
            
        addresses.push(ip.join("."));
      }
      
      this.ip4 = addresses.join(", ");
    } else
      this.ip4 = null;
    
    if (this.device_type == NetworkManager.DeviceType.WIFI) {
      let ap = this.nmdevice.get_active_access_point();
      if (ap) {
        let strength = ap.get_strength();
        
        if (strength > 80) strength = "excellent";
        else if (strength > 55) strength = "good";
        else if (strength > 30) strength = "ok";
        else if (strength > 5) strength = "weak";
        else strength = "none";
        
        if (this.signal_strength != strength) 
          this.icon.icon_name = "network-wireless-signal-" + strength;      
        this.signal_strength = strength;
      }
    }
    this.box.set_tooltip_text(this.GetTooltip())
  },
  
  // Searches for own interface name in net_dev and updates panel
  Update: function(net_dev, probe_time) {
    let dev = net_dev[this.if_name];
    if (!dev) return;

    let bytes_in_delta = dev["bytes_in"] - this.bytes_in;
    let bytes_out_delta = dev["bytes_out"] - this.bytes_out;

    this.bytes_in = dev["bytes_in"];
    this.bytes_out = dev["bytes_out"];
    
    let time_interval = (probe_time - this.last_probe_time) / 1000000;
    this.last_probe_time = probe_time;
    
    let speed_in = bytes_in_delta / time_interval;
    let speed_out = bytes_out_delta / time_interval;
    
    this.label_in.set_text(this.format_string(speed_in));    
    this.label_out.set_text(this.format_string(speed_out));
    
    if (this.ip4 == null || this.if_name == null)
      this.UpdateProperties();
  },
  
  /// Formats bytes per second as IEC 60027-2 units
  /// For example: 483 B/s, 67.3 KiB/s, 1.28 MiB/s
  format_string: function(Bps) {
    let unit = 0;

    while(Bps >= 1024) {
      Bps /= 1024;
      ++unit;
    }
    
    let precision = 0;
    if (unit > 0) {
      if (Bps < 10) precision = 2;
      else if (Bps < 100) precision = 1;
      precision = 3;
    }
    
    let label = Bps.toPrecision(3);
    if (unit == 0) label += " B/s";
    if (unit == 1) label += " KiB/s";
    if (unit == 2) label += " MiB/s";
    if (unit == 3) label += " GiB/s";   // envy

    return label;
  },
  
  GetIcon: function () {
    return this.icon;
  },
  
  GetBox: function() {
    return this.box;
  },
  
  GetTooltip: function() {
    let tooltip = this.if_name;
    if (this.ip4)
      tooltip += " (" + this.ip4 + ")"
    return tooltip;
  },
  
  Show: function() {
    this.box.show_all();
  },
  
  Hide: function() {
    this.box.hide_all();
  }
}

function NetSpeed() {
    this._init();
}


NetSpeed.prototype = {
  __proto__: PanelMenu.Button.prototype,

  active_interfaces: {},

  _init: function() {
    PanelMenu.Button.prototype._init.call(this, 0.0);
    
    this.ext_icon = new St.Icon({
      icon_type: St.IconType.SYMBOLIC,
      style_class: "popup-menu-icon",
      icon_name: "network-offline"
    });
    
    this.main_box = new St.BoxLayout();
    this.main_box.add_actor(this.ext_icon);

    this.actor.add_actor(this.main_box);
    Main.panel._rightBox.insert_actor(this.actor, 0);
    Main.panel._menus.addMenu(this.menu)

    this.menu_section_interfaces = new PopupMenu.PopupMenuSection(_("Show interfaces"));
    
    let title = new PopupMenu.PopupMenuItem(_("Show interfaces when connected"), { reactive: false, style_class: "section-title" });
    this.menu_section_interfaces.addMenuItem(title);
    this.menu.addMenuItem(this.menu_section_interfaces);
    
    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    
    this.menu_section_settings = new PopupMenu.PopupMenuSection("Settings");
    
    
    this.menu_section_settings.addSettingsAction(_("Network Settings"), "gnome-network-panel.desktop");
    
    this.menu.addMenuItem(this.menu_section_settings);
    
    this.nmclient = NMClient.Client.new();
    for each (let dev in this.nmclient.get_devices())
      this.device_added(this.nmclient, dev);
    this.nmclient.connect("device-added", Lang.bind(this, this.device_added));
    this.nmclient.connect("device-removed", Lang.bind(this, this.device_removed));
  },

  AddInterface: function(dev, net_dev) {
    this.active_interfaces[dev] = net_dev;
    let if_name = net_dev.if_name;
    net_dev.is_hidden = (settings.get_strv("hidden-interfaces").indexOf(if_name) >= 0);
    net_dev.onoff_menu = new PopupMenu.PopupSwitchMenuItem(if_name, !net_dev.is_hidden);
    net_dev.onoff_menu.connect("toggled", Lang.bind(this, function(m) {
      net_dev.is_hidden = !m.state;
      this.ShowInterface(net_dev, m.state);
      
      list = settings.get_strv("hidden-interfaces");
      let i = list.indexOf(net_dev.if_name);
      
      // Update hidden iterfaces list
      if (m.state) {
        list.splice(i, 1);
      } else if (i < 0) {
        list.push(net_dev.if_name);
      }
      settings.set_strv("hidden-interfaces", list);
    }));
    
    this.menu_section_interfaces.addMenuItem(net_dev.onoff_menu);
    this.main_box.add_actor(net_dev.GetBox());
    this.ShowInterface(net_dev, true);
  },
  
  RemoveInterface: function(dev) {
      if (!(dev in this.active_interfaces)) return;
      let net_dev = this.active_interfaces[dev];
      net_dev.onoff_menu.destroy();
      this.main_box.remove_actor(net_dev.GetBox());
      delete this.active_interfaces[dev];
  },

  Run: function() {
    Mainloop.timeout_add(UPDATE_INTERVAL, Lang.bind(this, this.on_timeout));
  },

  /// Fired every UPDATE_INTERVAL milliseconds
  /// Gets current time and netload statistics
  /// and updates all NetInterface instances.
  on_timeout: function() {
    let probe_time = GLib.get_monotonic_time();
    let net_dev = {};
    
    for each (let dev in this.active_interfaces) {
      let if_name = dev.if_name;
      try {
        GTop.glibtop_get_netload(dev.netload, if_name);
        /**
         * @todo Don't create a hash, but make NetInterface
         * use its own netload structure
         */
        net_dev[if_name] = {
          "bytes_in": dev.netload.bytes_in,
          "bytes_out": dev.netload.bytes_out
        }
      } catch (err) {
        //global.log("NetMonitor::Error: " + err);
      }
      
    }
    
    for each (let iface in this.active_interfaces)
      iface.Update(net_dev, probe_time);
    return true;
  },
  
  device_added: function(sender, dev) {
    dev.connect("state-changed", Lang.bind(this, this.device_state_changed));
    this.device_state_changed(dev, dev.get_state());
  },
    
  device_removed: function(sender, dev) {
    this.RemoveInterface(dev);
  },
  
  // Callback fired when state of interface is changed
  // Note that old_state and reason may be undefined
  device_state_changed: function(sender, new_state, old_state, reason) {
    let net_dev = this.active_interfaces[sender];
    
   
    if (!net_dev) {
      net_dev = new NetInterface(sender);
      this.AddInterface(sender, net_dev);
    }
    
    if (new_state == NetworkManager.DeviceState.ACTIVATED) {
      net_dev.is_active = true;
      this.ShowInterface(net_dev, true);
      net_dev.UpdateProperties();
    } else {
      net_dev.is_active = false;
      this.ShowInterface(net_dev, false);
    }
    
  },
 
  ShowInterface: function(net_dev, show) {
    let box = net_dev.GetBox();
    if (net_dev.is_active) {
      net_dev.onoff_menu.actor.remove_effect_by_name("grayscale");
      net_dev.onoff_menu.actor.reactive = true;
      net_dev.onoff_menu.label.set_text(net_dev.if_name);
    } else {
      if (!net_dev.onoff_menu.actor.get_effect("grayscale")) {
        let c = new Clutter.Color();
        c.from_string("darkgray");
        net_dev.onoff_menu.actor.add_effect_with_name("grayscale", new Clutter.ColorizeEffect({ tint: c }));
      }
      net_dev.onoff_menu.actor.reactive = false;
      net_dev.onoff_menu.label.set_text(net_dev.if_name + _(" (disconnected)"));
    }
    if (show && net_dev.is_active && !net_dev.is_hidden) {
      net_dev.Show();
    } else {
      net_dev.Hide();
    }
    this.ShowExtIcon();
  },

  // Checks if there are any interfaces shown on the panel and if there are, hides "offline" icon.
  ShowExtIcon: function() {
    let has_devices = false;
    for each (let d in this.active_interfaces) {
      if (d.is_active && !d.is_hidden) {
        has_devices = true;
        break;
      }
    }
    if (has_devices) this.ext_icon.hide_all();
    else this.ext_icon.show_all();
  }
};
 

function enable() {
  net_speed.actor.show();
}

function disable() {
  net_speed.actor.hide();
}

function init(extensionMeta) {
    let userExtensionLocalePath = extensionMeta.path + '/locale';
    Gettext.bindtextdomain("NetMonitor", userExtensionLocalePath);
    Gettext.textdomain("NetMonitor");
  
    net_speed = new NetSpeed();
    net_speed.Run();
}
