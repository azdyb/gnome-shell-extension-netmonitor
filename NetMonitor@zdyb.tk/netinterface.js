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
 
const GLib = imports.gi.GLib;
const NetworkManager = imports.gi.NetworkManager;
const NMClient = imports.gi.NMClient;
const GTop = imports.gi.GTop;

function NetInterface(extensionMeta, nmdevice) {
    this._init.apply(this, [extensionMeta, nmdevice]);
};

NetInterface.prototype = {
    nmdevice: null,
    bytes_in: 0,
    bytes_out: 0,
    speed_in: 0,
    speed_out: 0,
    last_probe_time: 0,
    
    _init: function(extensionMeta, nmdevice) {
        this.nmdevice = nmdevice;
    },
    
    update: function() {
        let netload = new GTop.glibtop_netload();
        let probe_time = GLib.get_monotonic_time();
        
        GTop.glibtop_get_netload(netload, this.get_ifname());
        
        let bytes_in_delta = netload.bytes_in - this.bytes_in;
        let bytes_out_delta = netload.bytes_out - this.bytes_out;
        
        this.bytes_in = netload.bytes_in;
        this.bytes_out = netload.bytes_out;
        
        let time_interval = (probe_time - this.last_probe_time) / 1000000;
        this.last_probe_time = probe_time;
        
        this.speed_in = bytes_in_delta / time_interval;
        this.speed_out = bytes_out_delta / time_interval;
    },
    
    get_ifname: function() {
        return this.nmdevice.interface;
    },
    
    get_type: function() {
        return this.nmdevice.device_type;
    },
    
    get_state: function() {
        return this.nmdevice.get_state();
    },
    
    is_connected: function() {
        return (this.nmdevice.get_state() == NetworkManager.DeviceState.ACTIVATED);
    },
    
    get_formated_speeds: function() {
        return [this.format_string(this.speed_in), this.format_string(this.speed_out)];
    },
    
    get_active_access_point: function() {
        if (this.nmdevice.device_type == NetworkManager.DeviceType.WIFI)
            return this.nmdevice.get_active_access_point();
        return null;
    },
    
    get_ip4: function() {
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
            
            return addresses;
        } else
            return [];
    },
    
    /// Formats bytes per second as IEC 60027-2 units
    /// For example: 483 B/s, 67.3 KiB/s, 1.28 MiB/s
    format_string: function(Bps) {
        let unit = 0;
      
        while(Bps >= 1024) {
            Bps /= 1024;
            ++unit;
        }
        
        // Can't use toPrecision as it may return exponential notation
        // let label = Bps.toPrecision(3);
        
        let precision = 0;
        if (Bps < 10) precision = 2;
        else if (Bps < 100) precision = 1;
        else precision = 0;
        
        let label = Bps.toFixed(precision);
        if (unit == 0) label += " B/s";
        if (unit == 1) label += " KiB/s";
        if (unit == 2) label += " MiB/s";
        if (unit == 3) label += " GiB/s";   // envy
      
        return label;
    }
}
