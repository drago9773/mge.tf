function postContent() {
    var message = document.getElementById("content").value;
    var title = "Placeholder Title";
    
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/postContent", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            var response = JSON.parse(xhr.responseText);
            if (xhr.status === 200) {
                alert("Message posted successfully");
                document.getElementById("content").value = '';
            } else {
                alert(response.error || "Error posting message");
            }
        }
    };
    xhr.send(JSON.stringify({ content: message, title: title }));
}
