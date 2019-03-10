"use strict"
console.log("popup.js")
let canvasUsers = []
let canvasIds = []
let canvasTitles = []

for (let i = 1; i <= 7; i++) {
    const users = []
    for (let e = 1; e <= i; e++) {
        users.push(e)
    }
    canvasUsers.push(users)
    canvasIds.push(i)
    canvasTitles.push(`fbc${i}`)
}
console.log(canvasUsers)
console.log(canvasIds)
console.log(canvasTitles)


$(document).ready(main);


// Used to call functions after page is fully loaded.
function main() {
    // send get request and set global arrays
    renderFbc()
}

function renderFbc() {
    const imgUrl = '/images/fbc.png'
    for (let i = 0; i < canvasIds.length; i++) {
        const html = `
        <div class="col-lg-3 col-md-6 col-sm-6 mb-4 post-column">
            <a href="" id="${canvasIds[i]}">
                <div class="card shadow postCard">
                    <div class="image-constrain">
                        <img src="${imgUrl}" class="card-img-top post-img p-3">
                    </div>
                    <div class="card-body text-center">
                        <h6 class="post-title font-weight-bold font-italic text-truncate">FBC 1</h6>
                    </div>
                </div>
            </a>
        </div>`
        const rowNum = Math.ceil((i + 1) /4)
        if (i % 4 == 0) {
            $('#post-TwoRow').append(`<div id="row${rowNum}"class="row fadeIn post-row"></div>`)
        }
        $(`#row${rowNum}`).append(html)
    }
}

function renderManageUsers() {

    let manageUsersContent = '<div class="modal-body"><form>'
    for(let i = 0; i < canvasTitles.length; i++){
        manageUsersContent += `<div><h5>${canvasTitles[i]}</h5>`
        for (let j = 0; j < canvasUsers[i].length; j++){
            manageUsersContent += `<div class="form-check">
        <input class="form-check-input" type="checkbox">
        <label class="form-check-label" for="defaultCheck1">${canvasUsers[i][j]}</label></div>`
        }
        manageUsersContent += `<button type="button" class="btn btn-light">Add</button>
            <button type="button" class="btn btn-light" onclick="removeUsers()">Remove</button></div>`
    }
    manageUsersContent += '</form></div>'
    $(".modal-title").html("Manage users")
    $(".modal-body").html(manageUsersContent)
}


function removeUsers() {
    const selected = $('.form-check-input:checked')
    const usersToRemove = []
    for (let e of selected) {
        usersToRemove.push(e.nextElementSibling.innerHTML)
    }
    const canvasTitle = selected[0].parentElement.parentElement.children[0].innerHTML
    const index = canvasTitles.findIndex(t => t == canvasTitle)
    canvasUsers[index] = canvasUsers[index].filter(u => !(usersToRemove.includes(u.toString())))
    console.log(canvasUsers)
    renderManageUsers()
    //send update request
}


function renderManageCanvas(){
    let manageCanvasContent = '<div class="modal-body"><form>'
    for (let i = 0; i < canvasTitles.length; i++){
        manageCanvasContent += `<div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="defaultCheck1">
        <label class="form-check-label" for="defaultCheck1">${canvasTitles[i]}</label>
    </div>`
    }
    manageCanvasContent += '</form></div>'

    $(".modal-title").html("Manage Canvas")
    $(".modal-body").html(manageCanvasContent)
    $(".modal-footer").html(`<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" onclick="addCanvas()">Add</button>
                    <button type="button" class="btn btn-primary" onclick="removeCanvas()">Remove</button>`)
}

function removeCanvas() {
    const selected = $('.form-check-input:checked')
    for (let e of selected) {
        const indexToRemove = canvasTitles.findIndex(t => t == e.nextElementSibling.innerHTML)
        canvasTitles.splice(indexToRemove, 1)
        canvasIds.splice(indexToRemove, 1)
        canvasUsers.splice(indexToRemove, 1)
    }
    console.log(canvasTitles)
    console.log(canvasIds)
    console.log(canvasUsers)
    renderManageCanvas()
    removeSection()
    renderFbc()
}

function removeSection() {
    $('section').html('')
}

