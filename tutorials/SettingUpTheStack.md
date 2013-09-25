# Configure Your Stack
------
As a developer I began making websites with zero server administration experience. I used commercial web hosting services that were both terribly interfaced and extremely limited (GoDaddy, Yahoo, etc.) As the sophistication of the things that I decided to build began to outgrow these services I decided that it was worth my time to learn to deploy a site using Amazon Web Services. Many of the webs most successful companies (Netflix, Tumblr, etc.) and most startups heavily rely on AWS, as it is very competitively priced. Unfortunately, for most front-end developers, learning to use these services is a daunting task. The purpose of this post is to guide a front-end engineer like myself through using AWS.

There are many services that are offered by AWS, but the most important is Elastic Compute Cloud (EC2) which allows users to create their own virtual servers which are partitioned from Amazon's data servers. As a result these are some of the fastest and most reliable servers you can use. Other crucial services that you will probably use are S3 (a storage service), Route 53 (A DNS management service) and Cloudfront (a CDN). You need only use Route 53 and EC2 to get started, but I recommend becoming very familiar with these four services and the many other products that AWS offers. A basic knowledge of Unix, SSH, and DNS is requisite to follow only with this post.

## Before you get Started
There are a few steps that obviously need to be done that I'm not going to get into for brevity's sake but should be very simple to figure out:
* Purchase a domain. Where you decide to purchase it from is purely up to you and honestly doesn't matter since you will be using Amazons Route 53 for DNS management.
* Sign up for Amazon Web Services. You can use an existing amazon account if you like

## Launch an EC2 Instance
------
First, let's fire up an EC2 instance. Amazon makes this very simple to do and while very serious projects will require some advanced configuration, a simple set up is all we need for our purposes. 
* From the AWS Console select EC2
* Select "Launch Instance"
* Select "Quick Launch Wizard"


The quick launch screen is fairly simple and asks you to name your instance and create a key pair. You will use this key to SSH to your server securely with root access without the use of a password (you don't want to use a password for many reasons that I won't get into). Give this new key pair a name and and select download. this will save your key (key_pair.pem) wherever you choose on your machine, but I recommend you move this key pair to a safe place on your machine like ~/.ssh. 

### Configure Ports
Great, now you have an instance up and running but that alone isn't really good for anything. In order for it to actually serve HTTP you need to open up the appropriate ports. The first step is to set up a security group. A security group acts like a configuration file for a firewall. It lets you set which ports are open to the world and which are closed.Click on the Security Groups tab. If you used the quick launch wizard AWS should have created a group for you titled something like "quicklaunch-1". You can use this or create your own security group. 
* Select the desired security group
* At the bottom of the screen, select the "Inbound" tab.
* Select SSH from the "create new rule" drop down and click "Add Rule". This will open up port 22, necessary if you want to have SSH access to your instances.
*  Repeat the process for port 80 (HTTP) and, if desired, port 443 (HTTPS).

### Connect to your instance
Now, if you want to SSH to your instance all you have to type is:
```sh
$ ssh -i ~/.ssh/your_key_pair.pem ec2-user@ec2-00-000-000-00.compute-1.amazonaws.com
```
##### Warning, if using Ubuntu or another image the user could be root or ubuntu instead of ec2-user 

Using the Public DNS that you find in your EC2 properties panel for that last part. Don't want to type such a horrendous message every time you want to connect to your instance? You should read this article on the ssh config file. This is a pretty brief overview of ssh and EC2 so for more details I would recommend the Amazon EC2 User Guide.

### Adding Users
Suppose you want to grant server access to someone else. This is simple:
New User's Computer
```sh
cd ~/.ssh
ssh-keygen (follow the prompt choose a passphrase if you like or just press enter twice)
```
This outputs two files, a private and public key (probably id_rsa and id_rsa.pub). You need to copy the contents of the latter and email to your server admin
##### Server Admin
```sh
ssh admin@101.0.0.0
sudo adduser newuser newuser
nano /home/newuser/.ssh/authorized_keys
```
Simply paste (new user's id_rsa.pub)
The new user can now connect:
```sh
ssh -i ~/.ssh/id_rsa newuser@101.0.0.0 
``` 
If you can understand what happened there then you have a good handle on how ssh works. 

## Configure the Server
------
So you're connected to your EC2 instance… What now? In the past the next steps were pretty straightforward and hardly disputable: Install and configure the typical LAMP stack technologies: PHP, MySQL and Apache. Most often, if you are a front-end developer you may not be very comfortable with learning a server side language like php or python. If this is the case you should be very excited about a new technology called Node.js If you have no idea what Node is, it is essentially Javascript for the server side. Your eyes probably light up at the idea alone, since JS has certainly become the default scripting language of the web. Most importantly, many beginners have experience with javascript, giving them the opportunity to expand their development to the server side.

There are many advantages to Node.js, but when choosing to build a site using it one has to keep in mind that it is not a very mature technology. The young, ever-changing nature of Node.js can present a challenge for developers. Regardless, Node is a reliable enough technology that is used by companies of the likes of Yahoo, Linkedin and many more. I have hopped on the bandwagon and recommend Node for it's simplicity above all.

###Setting Up Your Environment
If you are using Ubuntu or other Linux distributions you will likely be using apt-get or yum to do your install. If you are using configuring a development environment for your local machine you should install Homebrew, and it will pretty much do all of the heavy lifting for you. Homebrew (brew) is the likes of linux package managers for Mac OSX, a really brilliant invention. Once you have your package manager of choice in place your installation process can take seconds.

The first thing that you will probably be prompted to do when you ssh to your instance is to update. Obviously updating is always a good idea, so before you do anything else you should be sure to "sudo yum update".

###Install Nginx
Apache is by a long shot the most popular web server in existence (It is the A in LAMP after all) but many people are starting to realize the benefits of dumping Apache for Nginx because it is lighter and faster at serving static files. Installing Nginx is a breeze and its' configuration is simple:
```sh
sudo yum install nginx
emacs /etc/nginx/nginx.conf // update config with information like root location, domain name etc.
sudo service start nginx
```
And really that's it. Nginx has great documentation<link> for their servers and I would suggest spending some time reading as much as necessary, being sure to use best practices<link>. You'll also notice that an nginx.conf file is included in the boilerplate (config/nginx.conf). This is a configuration file that I would suggest using as it proxies node through nginx and uses nginx to serve static files rather than express (along with many other improvements to the default file). I like to symlink this file to /etc/nginx so that you can keep your config files under version control as well.

###Install Node
Installing and running node is a fairly straightforward process. Depending on what you're building you may require a specific version of Node.js, but this tutorial assumes you're fine with using the latest version.

On Mac:
```sh
brew install node
pat yourself on the back and grab a coffee
```
Using Ubuntu makes this much easier. For all the install guides see this.
```sh
sudo apt-get install node
```
The detailed long form version (Amazon Linux)
```sh
sudo yum install gcc-c++ make
sudo yum install openssl-devel
sudo yum install git
git clone git://github.com/joyent/node.git
cd node
./configure
make (will take 30+ mins)
sudo make install
```
Add to sudo's path:
```sh
sudo su
vi /etc/sudoers
```
Use the down keyboard arrow to find this line: "Defaults    secure_path = /sbin:/bin:/usr/sbin:/usr/bin"
add ":/usr/local/bin" to the end of the line
### Install npm
A great feature of Node is that it comes with a simple package manager that can allow you to extend node and download modules.
```sh
git clone https://github.com/isaacs/npm.git
cd npm
sudo make install
```
###Install Important Node Modules
As previously stated, Node has a great deal of modules that are easily downloaded using npm. While each web project should have it's own packages.json for installing dependencies there are a few modules that you may want to consider installing globally (i.e. sudo npm install -g whatever_module):
* Express: Sinatra inspired web development framework for node.js
* Stylus: Expressive, robust, feature-rich CSS language built for nodejs
* Jade: robust, elegant, feature rich template engine for nodejs
* Coffee-Script: Javascript pre-processor
* Forever: A simple CLI tool for ensuring that a given script runs continuously (i.e. forever)

## Build Your Node.js App
------
Now that you have node installed I would suggest using a node.js boilerplate to get your app up and running. I have provided a boilerplate that you can use to get started. Simply:
```sh`
git clone https://github.com/cdrake757/nodejs-boilerplate
```
If you want to add a private repo to your server, you have a few options. The simple solution is to clone the repo to a local machine and then scp the files to the server, but this can be very clunky. I would suggest using github deply keys which gives you single repo access, but this method is not devoid of disadvantages. <insert a link on deploy keys> This should be more than enough for you to get started with your own site. The provided boilerplate uses Express, Jade and Stylus. The important files to consider are:
* public/stylesheets/style.style.styl > Your core stylus document that should be included on each page. Personally, I prefer to keep all of my styles in one place with the exception of a few CSS libraries that you should import (animate.css, normalize.css etc.)
* routes/site.js > a simple router for rendering your templates
* config/config.js > a file for separating configurations, like port and host.
* server.coffee > You main app configuration file. You can run the app simply with
* coffee server.js // note that if you use forever you will have to compile coffee script to js

## Next Steps
------
Node.js is awesome, but definitely not so awesome that its the only software that you'll need. When I am trying to configure a server that is easy for me to use I always take the following steps:

### Download Your Favorite Text Editor
Chances are your server comes with a few text editors installed (generally vi, nano etc.), but if you're like me and you love emacs you'll need to sudo install emacs to make your life easier. 
 
### Customize Your Shell
Most linux machines use bash as the default shell, and if you've been using linux long enough it's likely that you have amassed an impressively large .bashrc (or .zshrc if you like me prefer the zsh shell) filled with aliases and enhancements to your shell environment. If you don't know what a .bashrc is then you should take the time to research how these files work and how they can make your life a lot easier. I would suggest perusing this.
* My .zsh rc
* Sample .bashrc

### Elastic/Dynamic IP
Now you have successfully configured your instance you need to be able to point your domain towards the server that you created. For convenience sake you will want to use what Amazon calls Elastic IP. This allows you to assign a unique IP address to your instance which makes managing DNS records easier. You can also easily switch which instance your Elastic IP is associated with, which can be helpful if you have several servers for development and may need to switch which server your domain points to. Adding an Elastic IP is simple:
* From the EC2 console select Elastic IPs
* Select Allocate New Address
* Choose Associate Address and then choose the instance you just created.

### Creating DNS Records
Finally in order for your www.domain.com to point to the server that you just started you need to update the DNS records for the domain. I would recommend using Amazon's Route 53 simply because it consolidates the services that you have to use to make changes. You'll first want to go to the Route 53 page and create a new Hosted Zone. Next, add all of the record sets that you may need (MX, CNAME, A, www, etc.). Finally return to your domain provider and change the name servers to those listed on your zone file at AWS.
 
### Follow up:
* Using Amazon's Elastic Block Store to schedule snapshot backups of server
* Creating an image of your server to easily replicate the server that you just built
* Use fabric for deployment shell scripts
* The same process for google compute

## Performance
Building a high performance website is a remarkably challenging feat, but there are very clear steps to follow to maximize the performance of your site or app. How you build your structure and build your applications matters immensely in regards to performance. A major consideration: running scripts blocks parallel downloads, which can slow down your site download times. 

Basic Rule: the most basic technologies (HTML/CSS) should be used in lieu of writing complicated scripts or using javascript plugins whenever possible.
* Make fewer HTTP requests
* Use a CDN
* Add an Expires header
* Gzip components
* Put stylesheets at the top
* Move scripts to the bottom
* Caching
* CSS image sprites
* Avoid CSS expressions
* Make JS and CSS external
* Reduce DNS lookups
* Minify JS
* Avoid redirects
* Remove duplicate scripts
* Configure ETags
* Make AJAX cacheable
