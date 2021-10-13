# RUN IT AT YOUR OWN RISK - RUN IT AT YOUR OWN RISK - RUN IT AT YOUR OWN RISK
> Run your own Twitter tipping bot just like @satoshi_LN_bot
> I recommend you use VPN when running this bot to hide your real IP

Requirements
1. Umbrel node https://getumbrel.com/ with inbound, and outbound capacity. 
I also recommended that you add your umbrel node IP address x.x.x.x umbrel.local to you local host file.
2. Twitter developer account https://developer.twitter.com/en

How to run the bot
1. git clone https://github.com/mrWiga/satoshi_LN_bot.git
2. run npm install to install all of the packages
3. Go to supabase.io, create a project and import database importSQL.txt - maybe someone can automate tables creation.
4. Rename config_sample.js to config.js and do the configuration
5. node startBot.js to start your bot