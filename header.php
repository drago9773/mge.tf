<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="header.css"/>
    <script src="script.js" defer></script>
</head>
<body>
    <header>
        <h1 class="title"><a href="index.php" class="title-link">MGE LEAGUE</a></h1>
        <div class="menu">
            <a class="menu-button home-button" href="index.php">Home</a>
            <a class="menu-button rules-button" href="rules.php">Rules</a>
            <div class="dropdown">
                <a class="menu-button signup-button" href="signup.php">Signup</a>
                <div class="dropdown-content">
                    <a href="1v1signup.php">1v1</a>
                    <a href="2v2signup.php">2v2</a>
                </div>
            </div>
            <div class="dropdown">
                <a class="menu-button league-button" href="league.php">League</a>
                <div class="dropdown-content">
                    <a href="season.php">Season 1</a>
                </div>
            </div>
            <a class="menu-button forum-button" href="forums.php">Forums</a>
            <!-- Add the signin button with login logo here -->
            <a class="menu-button signin-button">
                <a href="init-openId.php">
                <span>Login with Steam</span>
            </a>
        </div>
    </header>
</body>
</html>
