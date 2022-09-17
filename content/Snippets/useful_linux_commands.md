title: Useful Linux Commands
date: 2022/09/17

#### Add a user to a group
```bash
sudo usermod -a -G <group> <user>
# E.g. Add user "james" to Virtual Box shared folder group
sudo usermod -a -G vboxsf james
# E.g. Add user "james" to serial group 
sudo usermod -a -G dialout james
# E.g. Add current user to docker group
sudo usermod -a -G docker $USER
```

#### Make a random binary file
```bash
# Make 2048 byte random file
dd if=/dev/urandom of=file.bin bs=2048 count=1
```

#### Split and combine files
```bash
# Split a single file into multiple 1GB files
# Output files will be named split_file.bin.aa, split_file.bin.ab, etc
split -b 1G input_file.bin split_file.bin.

# Combine multiple files into one
cat split_file.bin.* > combined_file.bin
```

#### View logs of systemd services
```bash
# View logs
journalctl -u service.name
# View live updating logs
journalctl -f -u service.name
```

#### TAR commands
```bash
# Compress contents of directory of files 
cd dir_name
# How to remember: Compress Zee Filez, Verbose me now
tar czfv ../archive.tar.gz .
# Extract the files into the current directory
# How to remember: eXtract Zee File, Verbose me now
tar xzfv archive.tar.gz ./
```

#### Allow port with iptables
Allow incomming connections to TCP port 8080 on interface eth0.
```bash
iptables -A INPUT -i eth0 -p tcp --dport 8080 -j ACCEPT
# Make persistent
netfilter-persistent save
```

#### GDB
Run program with command line arguments.
```bash
gdb program_name
run <command_line_arguments>
```

#### NFS
```bash
# Share a directory
vi /etc/exports
# Add read / write access from 10.0.4.X
/path/to/dir 10.0.4.0/24(rw,sync,no_root_squash)
# Restart NFS
sudo systemctl restart nfs
```

#### SSH
Enable access to server via SSH key.
```bash
# Create SSH key (RSA)
ssh-keygen -t rsa -b 4096
# Create SSH key (ED25519)
ssh-keygen -t ed25519

# Copy SSH key to remote server
ssh-copy-id -i ~/.ssh/key_file_name user@host
```

Disable SSH host key checking. Useful when connecting to embedded systems with initramfs, as the host key changes each time. 
```bash
sudo vi ~/.ssh/config

Host 10.0.4.1
    StrictHostKeyChecking no
    UserKnownHostsFile=/dev/null

# Host file must be owned by root, and have no group / other write permissions
sudo chmod go-w ~/.ssh/config
```
Can use ```Host *``` to disable on all hosts, but not typically a good idea.

#### Fix "Failed To Load Selinux Policy, Freezing" error
Add `selinux=0` to the end of the linux16 grub boot command to allow you to boot the machine.

Once booted run:
```bash
sudo yum reinstall selinux-policy-targeted
```

#### Find Commands

```bash
# Recursively search for <string> in any file
grep -ri "<string>" .
# Recursively search for file or directory with <string> in file name
find . -name "*<string>*"
```

#### Python Webserver
```bash
python -m SimpleHTTPServer 8080
python3 -m http.server 8080
```

#### Useful Aliases
Add aliases to: `~/.bashrc`
```bash
# Save last command
alias savecmd='echo $(history -p !!) >> ~/saved_commands.txt'
# Search history (If Ctrl-R fails)
alias gh='history | grep'
```