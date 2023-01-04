# HelpQL
An experimental AI tool that can write a sql query based on the files provided


### Getting Started
```
$ mkdir source
$ npm i
$ # Add csv files to source folder prior to executing next command
$ npm run build:run
```

### Expected behavior
```
$ mkdir source
$ npm i
$ # Add csv files to source folder prior to executing next command
$ npm run build:run

:👨🏾‍💻: Tell me how I should write this query?
Can you get the all players who's points are over 30 in the 2020 season?


🕐 Analyzing playerStats csv...
🕐 Analyzing players csv...
✅ Processing playerStats csv to table complete
✅ Processing players csv to table complete

=======

SQL Query:

SELECT PlayerStats.player_name
FROM PlayerStats
INNER JOIN Players
ON PlayerStats.player_name = Players.player_name
WHERE PlayerStats.season = '2020'
AND PlayerStats.points > 30;

-- Get your game on!
=======
😉 Done!
```


#### Author: B.Shelling bshelling@gmail.com
