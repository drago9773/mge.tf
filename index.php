<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="shared.css"/>
    <link rel="stylesheet" href="index.css"/>
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
    <div class="placeholder">Placeholder for displaying live player ELO</div>
    <div class="button-container">
        <button class="tourney_button cup3" onClick="openInNewTab('https://brackethq.com/b/6lk1b/')">2v2 CUP 3 Results</button>
        <button class="tourney_button cup2" onClick="openInNewTab('https://brackethq.com/b/8lovb/')">2v2 CUP 2 Results</button>
        <button class="tourney_button cup1" onClick="openInNewTab('https://brackethq.com/b/5qorb/')">2v2 CUP 1 Results</button>
    </div>

    <script>
        function alertButton() {
            alert('Button clicked!');
        }

        function openInNewTab(url) {
            var win = window.open(url, '_blank');
            win.focus();
        }
    </script>
</body>
</html>
