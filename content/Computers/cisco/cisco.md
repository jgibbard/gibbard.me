title: Cisco IOS Cheatsheet
date: 2022/03/20
description: Cheatsheet for configuring Cisco routers and switches.
main_image: cisco.svg

## 1.0 General
```bash
# Enter Privileged EXEC mode (from User EXEC)
enable
# Enter Global config mode (from Privileged EXEC)
configure terminal
# Run privileged mode command without leaving config mode
# NB. no tab completion when doing this
do <privileged_mode_command>
# Exit Configure mode
exit
# Save config to NVRAM
copy running-config startup-config
# Exit Privileged EXEC
disable
```
N.B all commands can be abbreviated as long as the result is not ambiguous. e.g. ```copy run start```

Use ```?``` to show available commands.


### 1.1 See config / setup
```bash
# See current running config
show running-config
# See startup config
show startup-config
# See version of IOS that is running
show version
# See IOS images on flash
show flash
# See status of all interfaces
# N.B. Staus up, protocol down normally means cable disconnected
ip interface brief
# See detailed status of all interfaces
ip interface
# See detailed status of specific interface
ip interface f0/0
```

### 1.2 Erase configuration
```bash
enable
erase startup-config
reload
```

### 1.3 IOS Version Naming
```bash
c1841-ipbasek9-mz.124-15.T8.bin
# Compatible model number: Cisco 1841 Router
# Feature set: IP Base. K9 means cryptography payload included
# K9 = Cryprographic software included.
# Train: 12.4, Trottle: 15, Rebuild T8

c1900-universalk9-mz.SPA.153-3.M4.bin
# Compatible model number: Cisco 1900 series routers
# Feature set: Universal feature set. (Features are unlocked with licence keys)
#              K9 means cryptography payload included
# Train: 15.3, Trottle: 3, Rebuild M4
```

### 1.4 Upgrading IOS
Requires a TFTP server on PC. [This one](https://tftpd32.jounin.net){target="_blank} is good for windows.

```bash
enable
copy tftp flash
# Enter IP of TFTP server
# Enter file name of IOS .bin file on TFTP server
# Press enter to set the destination file name the same as the source file name

# Once complete, verify it has copied
show flash
# Set the system to boot from new IOS version
boot system flash:/<filename_of_new_ios_version>
# Save config and reboot device
copy running-config startup-config
reload
```

## 2.0 Cisco Router Configuration

### 2.1 Basic configuration
The initial configuration dialog is not very good, so answer ```no``` after a reset, and configure manually as per the commands below.
```bash
enable
configure terminal
# Set hostname
hostname JamesRouter
# Set domain
ip domain-name gibbard.local
# Set login banner
# The "#" can be any character. It is just the start and end delimiter for the message.
banner motd # Authorised use only # 
# Configure console port
line console 0
# Set password
password <password>
# Enable login
login
# Setting looging to not interrupt a line
logging sync
# Set same settings on AUX port too
line aux 0
password <password>
login
logging sync
# Back to global config
exit
# Set privileged password
enable secret <password>
# Enable password encryption
service password-encryption
# Stop device looking up mistyped commands as domain names
no ip domain-lookup
exit
# Save configuration
copy running-config startup-config
```

### 2.2 Configure Router Interfaces
```bash
enable
configure terminal
# Configure FastEthernet 0/0 interface
interface fastethernet0/0
# Set interface IP address and netmask
ip address 192.168.0.1 255.255.255.0
# Enable interface
no shutdown
exit
```

### 2.3 Configure Router Interfaces (IPv6)
```bash
enable
configure terminal
# Enable IPv6 for router (if required)
ipv6 unicast-routing
# Configure FastEthernet 0/0 interface
interface fastethernet0/0
ipv6 address 2001:db8:4:a::1/64
exit
```

### 2.4 Enable SSH
```bash
enable
configure terminal
crypto key generate rsa general-keys
Set bits: >=1024
# Turn on SSH v2
ip ssh version 2
# Set username
username james secret <password>
# Configure 5 virtual terminals (max 808 terminals)
line vty 0 4
# Enable SSH on VTYs
transport input ssh
# Use local U/N and  P/W database for authentication
login local
# Setting looging to not interrupt a line
logging sync
exit
```

When logged in over SSH use command ```terminal monitor``` to enable log messages to appear in the terminal for that session. (Log messages are on by default for direct serial consoles.)

### 2.5 Set up a static route

```bash
enable
# Show IP Routes
show ip route
# Add static route
configure terminal
ip route destination_network subnet_mask next_hop_neighbour 
# E.g. route traffic for 192.168.0.X to 10.0.4.2
ip route 192.168.0.0 255.255.255.0 10.0.4.2
```

You can also specify the exit interface of the router, but this should typically only be done if there is a point to point connection from the interface to another router.
```bash
enable
configure terminal
ip route destination_network subnet_mask exit_interface 
# E.g. route traffic for 192.168.0.X to FastEthernet0/1
ip route 192.168.0.0 255.255.255.0 f0/1
```

### 2.6 Getting access to a router if the password is lost
Connect to device via console port, and power cycle the device. Send a ```<BREAK>``` signal via serial to halt the boot process and enter ROM monitor (rommon) mode.

The Configuration Register sets boot options for the device. The "normal" configuration register value is ```0x2102```. This means load the IOS image specifed in startup-config file and then load the configuration from the startup-config.

If this register is instead set to ```0x2142``` this means load the IOS image specifed in startup-config file and then don't load the configuration from the startup-config.

```bash
# Power cycle
# <break> command sent
confreg 0x2142
reset
# Device reboots
# Answer "no" to configuration dialogue
enable
# Load original config
copy startup-config running-config
configure terminal
# Reset password
enable secret <new_password>
# Set configuration register back to original value
config-register 0x2102
# All interfaces will default to administratively down, so reenable
interface fastethernet0/0
no shutdown
# Repeat for other interfaces if required
int f0/1
no shutdown
exit
# Write config with new password back to NVRAM
copy running-config startup-config
```
## 3.0 Cisco Switch Configuration

### 3.1 Basic configuration
The initial configuration dialog is not very good, so answer ```no``` after a reset, and configure manually as per the commands below.
```bash
enable
configure terminal
# Set hostname
hostname JamesSwitch
# Set domain
ip domain-name gibbard.local
# Set login banner
# The "#" can be any character. It is just the start and end delimiter for the message.
banner motd # Authorised use only # 
# Configure console port
line console 0
# Set password
password <password>
# Enable login
login
# Setting looging to not interrupt a line
logging sync
# Back to global config
exit
# Set privileged password
enable secret <password>
# Enable password encryption
service password-encryption
# Stop device looking up mistyped commands as domain names
no ip domain-lookup
exit
# Save configuration
copy running-config startup-config
```
Note that the `startup-config` is actually stored in a file on the flash called `config.text`. Cisco aliases `startup-config` to this file.

### 3.2 Enable SSH
```bash
enable
configure terminal
crypto key generate rsa
Set bits: >=1024
# Turn on SSH v2
ip ssh version 2
# Set username
username james secret <password>
# Configure 5 virtual terminals (max 808 terminals)
line vty 0 4
# Enable SSH on VTYs
transport input ssh
# Use local U/N and  P/W database for authentication
login local
# Setting looging to not interrupt a line
logging sync
# Enable switched virtual interface (SVI) for SSH connections
# N.B. By defualt all switch ports are connected to vlan 1
interface vlan 1
# Set IP address
ip address <IP_Address> <Netmask>
no shutdown
exit
```

### 3.3 Getting access to a switch if the password is lost

Connect to device via console port. Unplug the switch, press and hold the button on the front of the swtich, plug the switch back in, release the button when text starts to appear on the console. If it takes over 20 seconds for test to appear, just release the button anyway.

```bash
# Initialise the flash
flash_init
# Look at flash memory
dir flash:
# You should see a number of files including config.text
# Rename the config file
flash:config.text flash:config.bak
# Boot up the switch
boot
# Answer "no" to configuration dialogue
enable
# Rename the config file back again
rename flash:config.bak config.text
# Load the saved config
copy flash:/config.text running-config
# Reset password
configure terminal
enable secret <new_password>
exit
# Write config with new password back to NVRAM
copy running-config startup-config
```

### 3.4 View MAC address table

```bash
# See full MAC address table
show mac address-table
# See just the dynamic MAC address table
show mac address-table dynamic
# See MAC address table for single interface
show mac address-table interface f0/1
```
