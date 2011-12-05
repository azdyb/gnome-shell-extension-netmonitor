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
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Gettext = imports.gettext;
const Clutter = imports.gi.Clutter;
const NMClient = imports.gi.NMClient;


const NetMonitor = imports.ui.extensionSystem.extensions["NetMonitor@zdyb.tk"];
const SpeedIndicator = NetMonitor.indicator.SpeedIndicator;
const NetInterface = NetMonitor.netinterface.NetInterface;


const _ = Gettext.gettext;

const UPDATE_INTERVAL = 2;


function NetSpeed(extensionMeta) {
    this._init.apply(this, [extensionMeta]);
}

NetSpeed.prototype = {
    __proto__: PanelMenu.Button.prototype,
  
    run: false,
    indicators: [],
    nmclient: null,
  
    _init: function(extensionMeta) {
        PanelMenu.Button.prototype._init.call(this, 0.0);
        
        this.extensionMeta = extensionMeta;
        
        this.build_ui();
        
        this.nmclient = NMClient.Client.new();
        for each (let dev in this.nmclient.get_devices()) {
            this.device_added(this.nmclient, dev);
        }
        this.nmclient.connect("device-added", Lang.bind(this, this.device_added));
        this.nmclient.connect("device-removed", Lang.bind(this, this.device_removed));
        
        this.indicator_visibility_changed();
    },
  
    build_ui: function() {
        this.icon = new St.Icon({
            icon_type: St.IconType.SYMBOLIC,
            style_class: "popup-menu-icon",
            icon_name: "network-offline"
        });
        
        this.main_box = new St.BoxLayout();
        this.main_box.add_actor(this.icon);
        
        this.actor.add_actor(this.main_box);
        
        this.menu_section_interfaces = new PopupMenu.PopupMenuSection(_("Show interfaces"));
        
        let title = new PopupMenu.PopupMenuItem(_("Show interfaces when connected"), { reactive: false, style_class: "section-title" });
        this.menu_section_interfaces.addMenuItem(title);
        this.menu.addMenuItem(this.menu_section_interfaces);
        
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        
        this.menu_section_settings = new PopupMenu.PopupMenuSection("Settings");
        
        this.menu_section_settings.addSettingsAction(_("Network Settings"), "gnome-network-panel.desktop");
        this.menu.addMenuItem(this.menu_section_settings);
    },
    
    /// Fired every UPDATE_INTERVAL seconds
    on_timeout: function() {
        for each (let ind in this.indicators) {
            ind.update();
        }
        return this.run;
    },
    
    enable: function() {        
        this.run = true;
        this.on_timeout();
        this._update_handler = Mainloop.timeout_add_seconds(UPDATE_INTERVAL, Lang.bind(this, this.on_timeout));
        Main.panel._rightBox.insert_actor(this.actor, 0);
        Main.panel._menus.addMenu(this.menu)
    },
    
    disable: function() {
        this.run = false;
        Mainloop.source_remove(this._update_handler);
        Main.panel._rightBox.remove_actor(this.actor);
        Main.panel._menus.removeMenu(this.menu)
    },
    
    device_added: function(sender, dev) {
        let ni = new NetInterface(this.extensionMeta, dev);
        let ind = new SpeedIndicator(this.extensionMeta, ni);
        
        ind.actor.connect("show", Lang.bind(this, this.indicator_visibility_changed, ind));
        ind.actor.connect("hide", Lang.bind(this, this.indicator_visibility_changed, ind));
        ind.menu.connect("toggled", Lang.bind(this, this.indicator_menu_toggled, ind));
        
        ind.set_hidden(false);
        this.main_box.add(ind.actor);
        this.menu_section_interfaces.addMenuItem(ind.menu);
        this.indicators.push(ind);
    },
      
    device_removed: function(sender, dev) {
        for (let i in this.indicators) {
            let ind = this.indicators[i];
            if (dev == ind.net_interface.nmdevice) {
                this.indicators.splice(i, 1);
                this.main_box.remove_actor(ind.actor);
                ind.destroy();
                break;
            }
        }
    },
   
    indicator_visibility_changed: function(indicator_actor, indicator) {
        for each(let ind in this.indicators) {
            if (ind.actor.visible) {
                this.icon.hide();
                return;
            }
        }
        this.icon.show();
    },
    
    indicator_menu_toggled: function(menu, state, indicator) {
        indicator.set_hidden(!state);
    }
};

function init(extensionMeta) {
    let userExtensionLocalePath = extensionMeta.path + '/locale';
    Gettext.bindtextdomain("NetMonitor", userExtensionLocalePath);
    Gettext.textdomain("NetMonitor");
    
    return new NetSpeed(extensionMeta);
}
