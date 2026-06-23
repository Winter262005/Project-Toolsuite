'use strict';


// ================================
// DATA
// ================================


const cities = [

    { name: "New York", zone: "America/New_York" },
    { name: "London", zone: "Europe/London" },
    { name: "Paris", zone: "Europe/Paris" },
    { name: "Berlin", zone: "Europe/Berlin" },
    { name: "Dubai", zone: "Asia/Dubai" },
    { name: "Mumbai", zone: "Asia/Kolkata" },
    { name: "Delhi", zone: "Asia/Kolkata" },
    { name: "Tokyo", zone: "Asia/Tokyo" },
    { name: "Seoul", zone: "Asia/Seoul" },
    { name: "Singapore", zone: "Asia/Singapore" },
    { name: "Hong Kong", zone: "Asia/Hong_Kong" },
    { name: "Bangkok", zone: "Asia/Bangkok" },
    { name: "Sydney", zone: "Australia/Sydney" },
    { name: "Toronto", zone: "America/Toronto" },
    { name: "Los Angeles", zone: "America/Los_Angeles" },
    { name: "Chicago", zone: "America/Chicago" },
    { name: "Moscow", zone: "Europe/Moscow" },
    { name: "Cairo", zone: "Africa/Cairo" },
    { name: "Cape Town", zone: "Africa/Johannesburg" },
    { name: "Rio", zone: "America/Sao_Paulo" }

];




// ================================
// GLOBAL VARIABLES
// ================================


const clockGrid =
    document.getElementById("clockGrid");


const searchBox =
    document.getElementById("citySearch");



let displayedCities = [...cities];




// ================================
// TAB SWITCH
// ================================


window.openTab = function (tabId, button) {


    document
        .querySelectorAll(".tool-section")
        .forEach(section => {

            section.classList.remove("active");

        });



    document
        .querySelectorAll(".tab")
        .forEach(tab => {

            tab.classList.remove("active");

        });



    document
        .getElementById(tabId)
        .classList.add("active");



    if (button) {

        button.classList.add("active");

    }


};





// ================================
// CLOCK CREATION
// ================================


function createClockCards() {


    clockGrid.innerHTML = "";


    displayedCities.forEach((city, index) => {


        const card =
            document.createElement("div");


        card.className = "clock-card";


        card.innerHTML = `

            <h4>
            ${city.name}
            </h4>


            <p>
            ${city.zone}
            </p>


            <div 
            class="clock-time"
            id="clock-${index}">
            
            --:--:--

            </div>

        `;



        clockGrid.appendChild(card);


    });


    updateClocks();


}






// ================================
// LIVE CLOCK UPDATE
// ================================


function updateClocks() {

    const now = new Date();

    displayedCities.forEach((city, index) => {


        const element =
            document.getElementById(
                `clock-${index}`
            );



        if (!element)
            return;



        element.innerHTML =

            new Intl.DateTimeFormat(
                "en-US",
                {

                    timeZone: city.zone,

                    hour: "2-digit",

                    minute: "2-digit",

                    second: "2-digit",

                    hour12: true

                }

            ).format(now);


    });


}



setInterval(updateClocks, 1000);

document.addEventListener('visibilitychange', (event) => {
    if(document.visibilityState === 'visible'){
        updateClocks();
    }
})






// ================================
// SEARCH
// ================================


searchBox.addEventListener(
"input",

()=>{


    const value =
    searchBox.value
    .toLowerCase()
    .trim();



    displayedCities = cities.filter(city => {


        const cityName = 
        city.name.toLowerCase();



        const timezone =
        city.zone.toLowerCase();



        return (

            cityName.includes(value)

            ||

            timezone.includes(value)

        );


    });



    createClockCards();


});







// ================================
// TIMEZONE DROPDOWNS
// ================================


const fromZone =
    document.getElementById("fromZone");


const toZone =
    document.getElementById("toZone");




function loadDropdowns() {


    cities.forEach(city => {


        const option1 =
            document.createElement("option");


        option1.value =
            city.zone;


        option1.textContent =
            city.name;



        fromZone.appendChild(option1);





        const option2 =
            document.createElement("option");


        option2.value =
            city.zone;


        option2.textContent =
            city.name;



        toZone.appendChild(option2);



    });



    fromZone.value =
        "Asia/Kolkata";


    toZone.value =
        "America/New_York";


}







// ================================
// TIME CONVERTER
// ================================


window.convertTime = function () {



    const dateValue =
        document.getElementById(
            "convertDate"
        ).value;



    if (!dateValue) {


        alert(
            "Please select date"
        );

        return;

    }



    const date =
        new Date(
            dateValue + "T00:00:00"
        );




    const result =

        new Intl.DateTimeFormat(
            "en-US",
            {

                timeZone:
                    toZone.value,

                dateStyle: "full",

                timeStyle: "long"

            }

        ).format(date);





    document
        .getElementById("convertResult")
        .innerHTML = `

    Converted Time:

    <br><br>

    <strong>
    ${result}
    </strong>

    `;


};







// ================================
// AGE CALCULATOR
// ================================


window.calculateAge = function () {



    const input =
        document.getElementById(
            "birthDate"
        ).value;



    if (!input) {

        alert(
            "Select birth date"
        );

        return;

    }



    const birth =
        new Date(input);



    const today =
        new Date();



    let age =
        today.getFullYear()
        -
        birth.getFullYear();




    const month =
        today.getMonth()
        -
        birth.getMonth();




    if (
        month < 0 ||
        (
            month === 0 &&
            today.getDate() < birth.getDate()
        )

    ) {

        age--;

    }




    document
        .getElementById("ageResult")
        .innerHTML = `


    Current Age:

    <br><br>


    <strong>
    ${age} Years
    </strong>


    `;


};








// ================================
// DEVELOPER TOOLS
// ================================



function showDev(text) {


    document
        .getElementById("devResult")
        .innerHTML = text;


}



window.unixNow = function () {


    showDev(

        "Unix Timestamp : "

        +

        Math.floor(
            Date.now() / 1000
        )

    );


};





window.isoNow = function () {


    showDev(

        "ISO 8601 : "

        +

        new Date()
            .toISOString()

    );


};





window.utcNow = function () {


    showDev(

        "UTC : "

        +

        new Date()
            .toUTCString()

    );


};









// ================================
// INITIAL LOAD
// ================================



document.addEventListener(
    "DOMContentLoaded",

    () => {


        loadDropdowns();


        createClockCards();



        document
            .getElementById("convertDate")
            .valueAsDate =
            new Date();



    });




    function convertTimezone(){


    const date =
    document.getElementById("convertDate").value;



    const time =
    document.getElementById("convertTime").value;



    const from =
    document.getElementById("fromZone").value;



    const to =
    document.getElementById("toZone").value;



    if(!date || !time){

        alert("Please select date and time");

        return;

    }



    const dateTime =
    `${date}T${time}:00`;



    const sourceDate =
    new Date(
        dateTime
    );



    const formatted =
    new Intl.DateTimeFormat(
        "en-US",
        {

        timeZone:to,

        dateStyle:"full",

        timeStyle:"medium"

        }

    ).format(sourceDate);



    document.getElementById(
        "conversionResult"
    ).innerHTML = `


    <h3>
    Converted Time
    </h3>


    <p>

    From:

    ${from}

    </p>


    <p>

    To:

    ${to}

    </p>



    <h2>

    ${formatted}

    </h2>


    `;


}

document.getElementById(
"convertDate"
).value =
new Date()
.toISOString()
.split("T")[0];



document.getElementById(
"convertTime"
).value =
new Date()
.toTimeString()
.slice(0,5);



// DEFAULT TODAY DATE

const birthInput =
document.getElementById("birthDate");


if(birthInput){


    const today =
    new Date();


    const formatted =

    today.getFullYear()
    +
    "-"
    +
    String(today.getMonth()+1)
    .padStart(2,"0")
    +
    "-"
    +
    String(today.getDate())
    .padStart(2,"0");



    birthInput.value = formatted;


}