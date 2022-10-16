title: Install Docker on Ubuntu
date: 2022/10/16

```bash
# Add docker repository
sudo apt-get install ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
# Install docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
# Start on boot
sudo systemctl enable docker.service
sudo systemctl enable containerd.service
# Allow non-root user to access docker (Not a particularly great idea...)
sudo groupadd docker
sudo usermod -aG docker $USER
# Reboot and test with the hello-world container
docker run hello-world
```