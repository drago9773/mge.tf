<?php
session_start();
if(!$_SESSION['logged_in']){
    header("location: error.php");
    exit();
}

$username = $_SESSION['userData']['name'];
$avatar = $_SESSION['userData']['avatar'];
$steamID = $_SESSION['userData']['steam_id'];

?>
<!DOCTYPE html>
<html>
<head>
    <?php include 'header.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" type="text/css" href="dashboard.css">
</head>
<body>
    <div class="dashboard-container">
        <h1>Welcome to the dashboard, <?php echo $username; ?></h1>
        <img src='<?php echo $avatar; ?>' alt="Avatar">
        <p>
            Steam Profile: 
            <a href="https://steamcommunity.com/profiles/<?php echo $steamID; ?>" target="_blank">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Steam_Logo.png" alt="Steam Logo">
            </a>
        </p>
        <p>
            Logs.tf Profile:
            <a href="https://logs.tf/profile/<?php echo $steamID; ?>" target="_blank">
                <img src="https://avatars.cloudflare.steamstatic.com/7bcc7b08e91659863bdbff2acf47ef5a25e9c3e9_full.jpg" alt="Logs.tf Logo">
            </a>
        </p>
        <p>
            RGL.gg Profile:
            <a href="https://rgl.gg/Public/PlayerProfile?p=<?php echo $steamID; ?>&r=40" target="_blank">
                <img src="https://liquipedia.net/commons/images/0/06/RGLgg_Blacktext.png" alt="RGL.tf Logo">
            </a>
        </p>
        <a href="logout.php">Logout</a>
    </div>
</body>
</html>
