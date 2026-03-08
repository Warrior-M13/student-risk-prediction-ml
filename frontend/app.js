function showPage(page){

document.getElementById("overview").style.display="none"
document.getElementById("prediction").style.display="none"

document.getElementById(page).style.display="block"

}

async function predict(){

let data = {
attendance_percentage: parseFloat(document.getElementById("attendance").value),
assignment_completion_rate: parseFloat(document.getElementById("assignment").value),
internal_marks: parseFloat(document.getElementById("marks").value),
study_hours_per_week: parseFloat(document.getElementById("hours").value),
previous_gpa: parseFloat(document.getElementById("gpa").value),
participation_score: parseFloat(document.getElementById("participation").value)
}

let response = await fetch("http://127.0.0.1:8000/predict",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(data)
})

let result = await response.json()

document.getElementById("result").innerText =
"Risk Probability: " + result.probability

const ctx = document.getElementById("probabilityChart").getContext("2d");

if(window.probChart){
window.probChart.destroy();
}

window.probChart = new Chart(ctx,{
type:"bar",
data:{
labels:["Risk Probability"],
datasets:[{
label:"Prediction",
data:[result.probability],
backgroundColor:"#ef4444"
}]
},
options:{
scales:{
y:{
min:0,
max:1
}
}
}
})

}


window.onload = function(){

// Risk distribution chart
const riskCtx = document.getElementById("riskChart").getContext("2d");

new Chart(riskCtx,{
type:"bar",
data:{
labels:["Low Risk","High Risk"],
datasets:[{
label:"Student Distribution",
data:[750,250],
backgroundColor:["#3b82f6","#ef4444"]
}]
}
})


// GPA distribution chart
const gpaCtx = document.getElementById("gpaChart").getContext("2d");

new Chart(gpaCtx,{
type:"line",
data:{
labels:["2","4","6","8","10"],
datasets:[{
label:"GPA Trend",
data:[50,200,400,250,100],
borderColor:"#3b82f6",
fill:false
}]
}
})

}