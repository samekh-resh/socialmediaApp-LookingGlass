var heart = document.getElementsByClassName("fa-heart");
var trash = document.getElementsByClassName("fa-trash");
var bookmark = document.getElementsByClassName("fa-bookmark");
var theLikes = document.getElementsByClassName("likes");


Array.from(bookmark).forEach(function(element) {
  element.addEventListener('click', function(){
   
    const postId= element.dataset.id
    fetch('bookmark', {
      method: 'put',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
    
        'postId':postId
      })
    })
    .then(response => {
      if (response.ok) return response.json()
    })
    .then(data => {
      console.log(data)
      window.location.reload(true)
    })
  });
});

Array.from(heart).forEach(function(element) {
      element.addEventListener('click', function(){
        console.log(this.parentNode.childNodes)
        // const name = this.parentNode.parentNode.childNodes[1].innerText
        const postId = this.parentNode.childNodes[1].innerText
        const likes = parseInt(this.parentNode.childNodes[3].innerText)

        // const thumbUp = parseFloat(this.parentNode.parentNode.childNodes[5].innerText)
        // const thumbUp = parseFloat(theLikes)
        console.log(likes)
        fetch('liked', {
          method: 'put',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            // 'name': name,
            // 'msg': msg,
            'postId' : postId,
            'likes': likes
          })
        })
        .then(response => {
          if (response.ok) return response.json()
        })
        .then(data => {
          console.log(data)
          window.location.reload(true)
        })
      });
});

Array.from(trash).forEach(function(element) {
      element.addEventListener('click', function(){
        const postId = this.parentNode.childNodes[1].innerText
        fetch('deletePost', {
          method: 'delete',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            'postId': postId
          })
        }).then(function (response) {
          window.location.reload()
        })
      });
});
