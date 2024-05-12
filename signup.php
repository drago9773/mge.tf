<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="shared.css"/>
    <link rel="stylesheet" href="signup.css"/>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MGE League</title>
</head>
<body>
    <header>
        <h1 class="title"><a href="index.php" class="title-link">MGE LEAGUE</a></h1>
        <div class="menu">
            <a class="menu-button home-button" href="index.php">Home</a>
            <a class="menu-button rules-button" href="rules.php">Rules</a>
            <a class="menu-button signup-button" href="signup.php">Signup</a>
            <a class="menu-button league-button" href="league.php">League</a>
            <a class="menu-button forum-button" href="forums.php">Forums</a>
        </div>
    </header>
    <h1 class="description">TF2's first ever MGE league</h1>
    <div class="button-container">
        <button class="custom-button button-blue" onClick="alertButton()">1v1</button>
        <button class="custom-button button-red" onClick="alertButton()">2v2</button>
    </div>
    
    <script src="app.js"></script>
</body>
</html>
