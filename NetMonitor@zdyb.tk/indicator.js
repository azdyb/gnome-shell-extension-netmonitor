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
const Lang = imports.lang;
const NetworkManager = imports.gi.NetworkManager;
const Mainloop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;

function SpeedIndicator(extensionMeta, net_interface) {
    this._init.apply(this, [extensionMeta, net_interface]);
};

SpeedIndicator.prototype = {
    net_interface: null,
    is_hidden: false,
    actor: null,
    menu: null,
    
    _init: function(extensionMeta, net_interface) {
        this.net_interface = net_interface;
        this.build_ui();
        this.net_interface.nmdevice.connect("state-changed", Lang.bind(this, this.state_changed));
    },
    
    build_ui: function() {
        this.icon = new St.Icon({
            icon_type: St.IconType.SYMBOLIC,
            style_class: "popup-menu-icon",
            icon_name: this.get_icon_name()
        });
        
        this.actor = new St.BoxLayout( { style_class: "speed-indicator", visible: (!this.is_hidden) } );
        this.actor.add_actor(this.icon);
        
        this.label_in = new St.Label({ style_class: "bandwidth-label", text: "---" });
        this.label_out = new St.Label({ style_class: "bandwidth-label", text: "---" });
        
        this.actor.add_actor(this.label_in);
        this.actor.add_actor(this.label_out);
        this.actor.connect("parent-set", Lang.bind(this, this.parent_set));
        
        this.menu = new PopupMenu.PopupSwitchMenuItem(this.net_interface.get_ifname(), !this.is_hidden);
    },
    
    parent_set: function(sender, old_parent) {
        this.state_changed(this.net_interface.nmdevice, this.net_interface.get_state());
    },
    
    state_changed: function(sender, new_state, old_state, reason) {
        this.show();
    },
    
    update: function() {
        this.net_interface.update();
        let speeds = this.net_interface.get_formated_speeds();
        this.label_in.set_text(speeds[0]);
        this.label_out.set_text(speeds[1]);
        this.icon.icon_name = this.get_icon_name();
    },
    
    show: function(force) {
        if (force) this.is_hidden = false;
        if ( (this.is_hidden == false) && this.is_active()) this.actor.show();
        else this.actor.hide();
        this.update_menu();
    },
    
    hide: function() {
        this.actor.hide();
        this.update_menu();
    },
    
    set_hidden: function(hidden) {
        this.is_hidden = hidden;
        this.show();
    },
    
    is_active_for_state: function(state) {
        return (state == NetworkManager.DeviceState.ACTIVATED);
    },
    
    is_active: function() {
        return this.is_active_for_state(this.net_interface.get_state())
    },
    
    get_icon_name: function() {
        // TODO: Add 3G, Bluetooth and so on...
        let icon_name = "network-wired";
        let type = this.net_interface.get_type();
    
        if (type == NetworkManager.DeviceType.ETHERNET) {
            icon_name = "network-wired";
        } else if (type == NetworkManager.DeviceType.WIFI) {
            let ap = this.net_interface.get_active_access_point();
            if (ap) {
                let strength = ap.get_strength();
                
                if (strength > 80) strength = "excellent";
                else if (strength > 55) strength = "good";
                else if (strength > 30) strength = "ok";
                else if (strength > 5) strength = "weak";
                else strength = "none";
                
                icon_name = "network-wireless-signal-" + strength;
            } else {
                icon_name = "network-offline";
            }
        }
        
        return icon_name;
    },
    
    update_menu: function() {
        let active = this.is_active();
        let label = this.net_interface.get_ifname();
        if (!active) label += _(" (disconnected)");
        
        this.menu.actor.reactive = active;        
        this.menu.label.set_text(label);
        this.menu.setToggleState(!this.is_hidden);
    },
    
    destroy: function() {
        this.actor.destroy();
        this.menu.destroy();
    }
}
