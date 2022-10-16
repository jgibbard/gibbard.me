title: Spoof a MAC address on Linux
date: 2022/10/16

Change MAC address for the current session
```bash
ip link set dev enp42s0 down
ip set link dev enp42s0 address 00:11:22:33:44:55
ip link set dev enp42s0 up
```

Change MAC address on every boot
```bash
# Add a new udev rule
vi /etc/udev/rules.d/81-mac-spoof.rules
```
```
ACTION=="add", SUBSYSTEM=="net", ATTR{address}=="XX:XX:XX:XX:XX:XX", RUN+="/usr/bin/ip link set dev $name address YY:YY:YY:YY:YY:YY"
```
Where `XX:XX:XX:XX:XX:XX` is the original MAC address, and `YY:YY:YY:YY:YY:YY` is the new MAC address

Change MAC address for the current session on legacy systems
```bash
ifconfig eth0 down
ifconfig eth0 hw ether 00:11:22:33:44:55
ifconfig eth0 up
```