
const none = 0;
const startingPoint = 1;
const goalPoint = 2;
const trafficLight = 3;
const gasStation = 4;
const someObject = 5;

class Point {
    constructor(isLocatable, x, y ,elementType, initState = 0) { // type이 0이면 아무것도 없는 것
        this.isLocatable = isLocatable;
        this.elementType = elementType;
        this.pos = {x: x, y: y};
        this.element = null;

        switch(elementType) {
            case none:
                break;
            case startingPoint:
                this.element = new StartPoint(initState);
                break;
            case goalPoint:
                this.element = new GoalPoint(initState);
                break;
            case trafficLight:
                this.element = new TrafficLight(initState);
                break;
            case gasStation:
                this.element = new GasStation(initState);
                break;
            case someObject:
                this.element = new SomeObject(initState);
                break;
        }
    }
}

class StartPoint {
    constructor(initState) {
        this.dir = initState;
    }

    init(initState) {
        this.dir = initState;
    }
}

class GoalPoint {
    constructor(initState) {
        this.dir = initState;
    }

    init(initState) {
        this.dir = initState;
    }
}

class TrafficLight {
    constructor(initState) {
        this.state = initState;
        this.maxState = 9;
        this.color = 0;
        this.changeColor();
    }

    init(initState) {
        this.state = initState;
        this.color = 0;
        this.changeColor();
    }

    nextState() {
        this.state += 1;
        this.state %= this.maxState;
        this.changeColor();
    }

    setState(state) {
        this.state = state;
    }

    getState() {
        return this.state;
    }

    getColor() {
        return this.color;
    }

    changeColor() {
        switch(this.state) {
            case 0:
            case 1:
            case 2:
                this.color = 0; // 초록불
                break;
            case 3:
            case 4:
                this.color = 1; // 노란불
                break;
            case 5:
            case 6:
            case 7:
            case 8:
                this.color = 2; // 빨간불
                break;
        }
    }
}

class GasStation {
    constructor(initState) {
        this.gas = initState;
    }

    init(initState) {
        this.gas = initState;
    }
}

class SomeObject {
    constructor(initState) {
        this.something = initState; // 0, 1, 2 장애물
        this.exist = 1; // 경적으로 없애면 0이 됨.
    }

    init(initState) {
        this.something = initState;
        this.exist = 1;
    }
}

let limitTurn = 0;
let turn = 0; // 움직임 횟수. 시간같은 개념
let fuel = 0; // 자동차 연료
let getGas = 0;
let speed = 1;
let gameOver = false;
let gameOverText = null;
let gridOn = true;

const runningSound = new Audio("/resources/sounds/brace/running.mp3");
runningSound.loop = true;
runningSound.volume = 1;
const hornSound = new Audio("/resources/sounds/brace/horn.mp3");
hornSound.loop = false;
hornSound.volume = 1;

let imgCar = new Image();
imgCar.src = "/resources/images/brace/cars/car1.png";
let imgEle = new Image();
imgEle.src = "/resources/images/brace/elements/element1/element.png"
let imgMap = null;

let imgMapList = [];

for(var i=1; i<=4; i++){
	let temp = new Image();
	temp.src = "/resources/images/brace/maps/map"+i+"/road.png";
	imgMapList.push(temp);
}


const tileLength = 50;
const lineWidth = 1;

const right = true;
const left = false;

const forward = 1;
const leftForward = 2;
const rightForward = 3;
const backward = 4;
const leftBackward = 5;
const rightBackward = 6 ;
const stay = 7;
const honk = 8;

const compass = [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}]
const up = 0;
const rig = 1;
const down = 2;
const lef = 3;

const carWidth = 25;
const carHeight = 41;

const elementSize = 70;

// const json = null; // DB에서 받아온 json파일
// const mapObj = JSON.parse(json);
const mapWidth = mapObj.mw;
const mapHeight = mapObj.mh;
const startingFuel = mapObj.sf;
const originPoint = mapObj.op;
const startingPos = mapObj.sp;
const goalPos = mapObj.gp;
const startingDirection = mapObj.sd; // 상(0,-1) 하(0, 1) 좌(-1, 0) 우(1, 0)
const mapImgList = mapObj.mil;
const pointList = new Array(mapHeight + 1).fill(null).map(() => new Array(mapWidth + 1)); // 각 점의 정보와 요소 세팅

window.onload = function() {
    resetCanvasOrigin();
    setCanvasOrigin();

	imgMap = imgMapList[parseInt(getCookie("mid"))-1];

	$("#blockLimitCnt").text(mapObj.lb);
	$("#speed").change(function() {
		changeSpeed(parseFloat($(this).val()));
	});

	$(".map-option-item").click(function(){
		var idx = $(this).attr("id").substring(3);
		changeImg(idx);
		deleteCookie("mid");
		setCookie("mid", idx, 1);
	});

	resizeCanvas();

	initPoint();
    initMap(); // 맵 그리기
    initCar(); // 자동차 데이터 설정, 그리기

    drawElement(); // 요소 그리기
    gridEvent();
}

function setCookie(name, value) {
	var date = new Date();
	date.setTime(date.getTime() + 24*60*60*1000);
	document.cookie = name + '=' + value + ';expires=' + date.toUTCString() + ';path=/';
};

function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : 1;
}

var deleteCookie = function(name) {
	document.cookie = name + '=; expires=Thu, 01 Jan 1999 00:00:10 GMT;';
}

function changeImg(idx){
	imgMap = imgMapList[idx-1];
	initMap();
}

function initPoint(){
	for (let y = 0; y < mapHeight + 1; y++) { // 포인트와 요소 초기화
        for (let x = 0; x < mapWidth + 1; x++) {
            pointList[y][x] = new Point(mapObj.pl[y][x].lct, x, y, mapObj.pl[y][x].et, mapObj.pl[y][x].ist);
        }
    }
}

function changeSpeed(m){
	speed = m;
}

function resizeCanvas(){
    $("canvas").each(function(i, element) {
    	element.width = mapWidth*(tileLength + lineWidth) + lineWidth;
    	element.height = mapHeight*(tileLength + lineWidth) + lineWidth;
    })
}

function initMap() {
    const mapCanvas = document.getElementById("mapImgCanvas");
    const mapContext = mapCanvas.getContext("2d");
    mapContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    drawMap(mapContext, mapImgList, mapHeight, mapWidth);
    console.log("맵 초기화");
}

function clearMap() {
    const mapCanvas = document.getElementById("mapImgCanvas");
    const mapContext = mapCanvas.getContext("2d");

    mapContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
}

function drawMap(mapContext, mapImgList, mapHeight, mapWidth) {
    // imgMap을 통해 그림을 그림.
    for (let row = 0; row < mapHeight; row++) {
        for (let column = 0; column < mapWidth; column++) {
            mapContext.drawImage(imgMap,
                (tileLength + 2*lineWidth) * mapImgList[row][column].in,
                (tileLength + 2*lineWidth) * mapImgList[row][column].d,
                (tileLength + 2*lineWidth), (tileLength + 2*lineWidth),
                (tileLength + lineWidth) * column, (tileLength + lineWidth) * row,
                (tileLength + 2*lineWidth), (tileLength + 2*lineWidth));
        }
    }
	// 점 찍기
    for (let row = 0; row < mapHeight; row++) {
        for (let column = 0; column < mapWidth; column++) {
            if ((row + column)%2 == 1 && pointList[row][column].isLocatable == true) {
				mapContext.save();
                mapContext.translate((tileLength + lineWidth) * column + lineWidth/2, (tileLength + lineWidth) * row + lineWidth/2);
                mapContext.beginPath();

				var color="white";
				if(pointList[row][column].elementType == 2){
					color = "orange";
				}

				mapContext.fillStyle = color;
				mapContext.fillRect(-5, -5, 10, 10);
                mapContext.fill();
                mapContext.closePath();
                mapContext.restore();
            }
        }
    }
}

function setCanvasOrigin() {
    const mapCanvas = document.getElementById("mapImgCanvas");
    const mapContext = mapCanvas.getContext("2d");
    const gridCanvas = document.getElementById("gridCanvas");
    const gridContext = gridCanvas.getContext("2d");
    const carCanvas = document.getElementById("carImgCanvas");
    const carContext = carCanvas.getContext("2d");
    const elementCanvas = document.getElementById("elementImgCanvas");
    const elementContext = elementCanvas.getContext("2d");

    mapContext.translate((tileLength + lineWidth) * originPoint.x, (tileLength + lineWidth) * originPoint.y);
    gridContext.translate((tileLength + lineWidth) * originPoint.x, (tileLength + lineWidth) * originPoint.y);
    carContext.translate((tileLength + lineWidth) * originPoint.x, (tileLength + lineWidth) * originPoint.y);
    elementContext.translate((tileLength + lineWidth) * originPoint.x, (tileLength + lineWidth) * originPoint.y);
}

function resetCanvasOrigin() {
    const mapCanvas = document.getElementById("mapImgCanvas");
    const mapContext = mapCanvas.getContext("2d");
    const gridCanvas = document.getElementById("gridCanvas");
    const gridContext = gridCanvas.getContext("2d");
    const carCanvas = document.getElementById("carImgCanvas");
    const carContext = carCanvas.getContext("2d");
    const elementCanvas = document.getElementById("elementImgCanvas");
    const elementContext = elementCanvas.getContext("2d");

    mapContext.setTransform(1, 0, 0, 1, 0, 0);
    gridContext.setTransform(1, 0, 0, 1, 0, 0);
    carContext.setTransform(1, 0, 0, 1, 0, 0);
    elementContext.setTransform(1, 0, 0, 1, 0, 0);
}

function drawElement() {
    const elementCanvas = document.getElementById("elementImgCanvas");
    const elementContext = elementCanvas.getContext("2d");

    elementContext.clearRect(0, 0, elementCanvas.width, elementCanvas.height);

    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            if (pointList[y][x].element != null) {
                elementContext.save();
                switch(pointList[y][x].elementType) {
                    case startingPoint:
                        elementContext.translate((tileLength + lineWidth) * (x + compass[pointList[y][x].element.dir].x) + lineWidth, (tileLength + lineWidth) * (y + compass[pointList[y][x].element.dir].y) + lineWidth);
                        elementContext.drawImage(imgEle, (tileLength + lineWidth) * startingPoint, 0, tileLength, tileLength, -elementSize/2, -elementSize/2, elementSize, elementSize);
                        break;
                    case goalPoint:
                        elementContext.translate((tileLength + lineWidth) * (x + compass[pointList[y][x].element.dir].x) + lineWidth, (tileLength + lineWidth) * (y + compass[pointList[y][x].element.dir].y) + lineWidth);
                        elementContext.drawImage(imgEle, (tileLength + lineWidth) * goalPoint, 0, tileLength, tileLength, -elementSize/2, -elementSize/2, elementSize, elementSize);
                        break;
                    case trafficLight:
                        elementContext.translate((tileLength + lineWidth) * x + lineWidth, (tileLength + lineWidth) * y + lineWidth);
                        elementContext.drawImage(imgEle, (tileLength + lineWidth) * trafficLight, (tileLength + lineWidth) * pointList[y][x].element.getColor(), tileLength, tileLength, -elementSize/2, -elementSize/2, elementSize, elementSize);
                        console.log("신호등 색 " + pointList[y][x].element.getColor());
                        console.log("신호등 상태 " + pointList[y][x].element.getState());
                        break;
                    case gasStation:
                        let remainGas = 1;
                        if(pointList[y][x].element.gas > 0) {
                            remainGas = 0;
                        }
                        elementContext.translate((tileLength + lineWidth) * x + lineWidth, (tileLength + lineWidth) * y + lineWidth);
                        elementContext.drawImage(imgEle, (tileLength + lineWidth) * gasStation, (tileLength + lineWidth) * remainGas, tileLength, tileLength, -elementSize/2, -elementSize/2, elementSize, elementSize);
                        break;
                    case someObject:
                        if (pointList[y][x].element.exist == 1)
                        elementContext.translate((tileLength + lineWidth) * x + lineWidth, (tileLength + lineWidth) * y + lineWidth);
                        elementContext.drawImage(imgEle, (tileLength + lineWidth) * someObject, (tileLength + lineWidth) * pointList[y][x].element.something, tileLength, tileLength, -elementSize/2, -elementSize/2, elementSize, elementSize);
                        break;
                }
                elementContext.restore();
            }
        }
    }
}

async function someObjectAnimation(pos, something) {
    const startPos = {x: (tileLength + lineWidth) * pos.x + lineWidth, y: (tileLength + lineWidth) * pos.y + lineWidth};
    const nowSize = {x: elementSize, y: elementSize};

    const elementCanvas = document.getElementById("elementImgCanvas");
    const elementContext = elementCanvas.getContext("2d");

    while (nowSize.x > 0) {
        elementContext.save();
        elementCanvas.translate(startPos.x, startPos.y);
        elementContext.clearMap(-nowSize.x/2, -nowSize.y/2, nowSize.x, nowSize.y);
        elementContext.drawImage(imgEle, (tileLength + lineWidth) * someObject, (tileLength + lineWidth) * something, tileLength, tileLength, -nowSize.x/2, -nowSize.y/2, nowSize.x, nowSize.y);
        elementContext.restore();
        nowSize.x -= elementSize*speed/30;
        nowSize.y -= elementSize*speed/30;
        await delay(5);
    }

    elementContext.save();
    elementCanvas.translate(startPos.x, startPos.y);
    elementContext.clearMap(-elementSize/2, -elementSize/2, elementSize, elementSize);
    elementContext.restore();
}

function initElement() {
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            if (pointList[y][x].element != null) {
                pointList[y][x].element.init(mapObj.pl[y][x].ist);
            }
        }
    }

    drawElement();
}


// 검은색 격자무늬를 그림
function drawBlackGrid() {
    const gridCanvas = document.getElementById("gridCanvas");
    const gridContext = gridCanvas.getContext("2d");

    gridContext.save();
    gridContext.beginPath();
    gridContext.lineWidth = lineWidth;

    for (let y = 1; y < mapHeight; y += 2) {
        gridContext.moveTo(tileLength + lineWidth + lineWidth/2, y * (tileLength + lineWidth) + lineWidth/2);
        gridContext.lineTo((tileLength + lineWidth) * (mapWidth - 1) + lineWidth/2, y * (tileLength + lineWidth) + lineWidth/2);
        gridContext.stroke();
    }

    for (let x = 1; x < mapWidth; x += 2) {
        gridContext.moveTo(x * (tileLength + lineWidth) + lineWidth/2, (tileLength + lineWidth) + lineWidth/2);
        gridContext.lineTo(x * (tileLength + lineWidth) + lineWidth/2, (tileLength + lineWidth) * (mapHeight - 1) + lineWidth/2);
        gridContext.stroke();
    }

    gridContext.closePath();
    gridContext.restore();
}

function eraseBlackGrid() {
    const gridCanvas = document.getElementById("gridCanvas");
    const gridContext = gridCanvas.getContext("2d");
    gridContext.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
}

function gridEvent() {
    gridOn = !gridOn;

    if (gridOn) {
        drawBlackGrid();
    } else {
        eraseBlackGrid();
    }
}

const car = {
    pos : {x: -1, y: -1},
    dir : -1,
    turn : function(isRight) { // true는 우회전 false는 좌회전
        if (isRight) {
            this.dir++;
        }
        else {
            this.dir += 3;
        }

        this.dir %= 4;
    },
    go : function() {
        this.pos.x += compass[this.dir].x;
        this.pos.y += compass[this.dir].y;
    },
    back : function() {
        this.pos.x -= compass[this.dir].x;
        this.pos.y -= compass[this.dir].y;
    },
    forward : function() {
        this.go();
        this.go();
    },
    rightForward : function() {
        this.go();
        this.turn(right);
        this.go();
    },
    leftForward : function() {
        this.go();
        this.turn(left);
        this.go();
    },
    backward : function() {
        this.back();
        this.back();
    },
    rightBackward : function() {
        this.back();
        this.turn(left);
        this.back();
    },
    leftBackward : function() {
        this.back();
        this.turn(right);
        this.back();
    }
}

function calPos(dir) {
    switch(dir) {
        case forward: // 전진
            car.forward();
            break;
        case leftForward: // 전진 좌회전
            car.leftForward();
            break;
        case rightForward: // 전진 우회전
            car.rightForward();
            break;
        case backward: // 후진
            car.backward();
            break;
        case leftBackward: // 후진 좌회전
            car.leftBackward();
            break;
        case rightBackward: // 후진 우회전
            car.rightBackward();
            break;
        case stay: // 대기
            break;
        case honk: // 경적
            break;
    }
}

function rotateCar(carContext, dir = car.dir) {
    carContext.rotate(dir * Math.PI/2);
}

function updateFuel(){
	$("#fuelCnt").text(fuel);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fueling(gas) {
    let time = 0;
    let fuelTime = 0;

    while(time < 100) {
        while (time > fuelTime) {
            fuel += 1;
            updateFuel();
            fuelTime += 100/gas;
        }

        time += speed;
        await delay(5);
    }
}

async function forwardAnimation(carCanvas, carContext, startPos, startDir, distance = 0) {

    carContext.clearRect(0, 0, carCanvas.width, carCanvas.height);
    carContext.save();
    if (distance + (speed * 2*(tileLength + lineWidth)/100) < 2*(tileLength + lineWidth)) {
        carContext.translate(startPos.x * (tileLength + lineWidth) + lineWidth/2 + compass[car.dir].x * (distance + speed * 2*(tileLength + lineWidth)/100),
                             startPos.y * (tileLength + lineWidth) + lineWidth/2 + compass[car.dir].y * (distance + speed * 2*(tileLength + lineWidth)/100));
        rotateCar(carContext);
        carContext.drawImage(imgCar, -carWidth/2, -carHeight/2);
        carContext.restore();

        // 주유소 처리
        if (getGas > 0 && distance + (speed * 2*(tileLength + lineWidth)/100) > (tileLength + lineWidth)) {
            await fueling(getGas);
            getGas = 0;
            pointList[startPos.y + compass[startDir].y][startPos.x + compass[startDir].x].element.gas = 0;
            turn++;
            setAfterMove();
        }

        await delay(5);
        await forwardAnimation(carCanvas, carContext, startPos, startDir, distance + speed * 2*(tileLength+lineWidth)/100);
    } else {
        carContext.translate(car.pos.x * (tileLength + lineWidth) + lineWidth/2, car.pos.y * (tileLength + lineWidth) + lineWidth/2);
        rotateCar(carContext);
        carContext.drawImage(imgCar, -carWidth/2, -carHeight/2);
        carContext.restore();
    }
}

async function forwardAnimation(carCanvas, carContext, startPos, startDir, distance = 0) {

    carContext.clearRect(0, 0, carCanvas.width, carCanvas.height);
    carContext.save();
    if (distance + (speed * 2*(tileLength + lineWidth)/100) < 2*(tileLength + lineWidth)) {
        carContext.translate(startPos.x * (tileLength + lineWidth) + lineWidth/2 + compass[car.dir].x * (distance + speed * 2*(tileLength + lineWidth)/100),
                             startPos.y * (tileLength + lineWidth) + lineWidth/2 + compass[car.dir].y * (distance + speed * 2*(tileLength + lineWidth)/100));
        rotateCar(carContext);
        carContext.drawImage(imgCar, -carWidth/2, -carHeight/2);
        carContext.restore();

        // 주유소 처리
        if (getGas > 0 && distance + (speed * 2*(tileLength + lineWidth)/100) > (tileLength + lineWidth)) {
            await fueling(getGas);
            getGas = 0;
            pointList[startPos.y + compass[startDir].y][startPos.x + compass[startDir].x].element.gas = 0;
            turn++;
            setAfterMove();
        }

        await delay(5);
        await forwardAnimation(carCanvas, carContext, startPos, startDir, distance + speed * 2*(tileLength+lineWidth)/100);
    } else {
        carContext.translate(car.pos.x * (tileLength + lineWidth) + lineWidth/2, car.pos.y * (tileLength + lineWidth) + lineWidth/2);
        rotateCar(carContext);
        carContext.drawImage(imgCar, -carWidth/2, -carHeight/2);
        carContext.restore();
    }
}

async function backwardAnimation(carCanvas, carContext, startPos, startDir, distance = 0) {

    carContext.clearRect(0, 0, carCanvas.width, carCanvas.height);
    carContext.save();
    if (distance + (speed * 2*(tileLength + lineWidth)/100) < 2 * (tileLength + lineWidth)) {
        carContext.translate(startPos.x * (tileLength + lineWidth) + lineWidth/2 - compass[car.dir].x * (distance + speed * 2*(tileLength+lineWidth)/100),
                             startPos.y * (tileLength + lineWidth) + lineWidth/2 - compass[car.dir].y * (distance + speed * 2*(tileLength+lineWidth)/100));
        rotateCar(carContext);
        carContext.drawImage(imgCar, -carWidth/2, -carHeight/2);
        carContext.restore();

        // 주유소 처리
        if (getGas > 0 && distance + (speed * 2*(tileLength + lineWidth)/100) > (tileLength + lineWidth)) {
            await fueling(getGas);
            getGas = 0;
            pointList[startPos.y + compass[startDir].y][startPos.x + compass[startDir].x].element.gas = 0;
            turn++;
            setAfterMove();
        }

        console.log(distance);
        await delay(5);
        await backwardAnimation(carCanvas, carContext, startPos, startDir, distance + speed * 2*(tileLength+lineWidth)/100);
    } else {
        carContext.translate(compass[car.dir].x * 2*(tileLength + lineWidth) + lineWidth/2, compass[car.dir].y * 2*(tileLength + lineWidth) + lineWidth/2);
        rotateCar(carContext);
        carContext.drawImage(imgCar, -carWidth/2, -carHeight/2);
        carContext.restore();
    }

}

async function leftForwardAnimation(carCanvas, carContext, startPos, startDir, radian = 0) {
    carContext.clearRect(0, 0, carCanvas.width, carCanvas.height);
    carContext.save();
    if (radian + speed * Math.PI/200 < Math.PI/2) {
        carContext.translate(startPos.x * (tileLength + lineWidth) + lineWidth/2, startPos.y * (tileLength + lineWidth) + lineWidth/2);
        carContext.translate(compass[(startDir+3)%4].x * (tileLength + lineWidth), compass[(startDir+3)%4].y * (tileLength + lineWidth));
        carContext.rotate(-(radian + speed * Math.PI/200));
        carContext.translate(-compass[(startDir+3)%4].x * (tileLength + lineWidth), -compass[(startDir+3)%4].y * (tileLength + lineWidth));
        rotateCar(carContext, startDir);
        carContext.drawImage(imgCar, -carWidth/2, -carHeight/2);
        carContext.restore();

        // 주유소 처리
        if (getGas > 0 && radian + speed * Math.PI/200 > Math.PI/4) {
            await fueling(getGas);
            getGas = 0;
            pointList[startPos.y + compass[startDir].y][startPos.x + compass[startDir].x].element.gas = 0
            turn++;
            setAfterMove();
        }

        console.log(radian);
        await delay(5)
        await leftForwardAnimation(carCanvas, carContext, startPos, startDir, radian + speed * Math.PI/200);
    }
    else {
        carContext.translate(car.pos.x * (tileLength + lineWidth) + lineWidth/2, car.pos.y * (tileLength + lineWidth) + lineWidth/2);
        rotateCar(carContext);
        carContext.drawImage(imgCar, -carWidth/2, -carHeight/2);
        carContext.restore();
        console.log("애니메이션 마지막 else");
    }
}

async function rightForwardAnimation(carCanvas, carContext, startPos, startDir, radian = 0) {
    carContext.clearRect(0, 0, carCanvas.width, carCanvas.height);
    carContext.save();
    if (radian + speed * Math.PI/200 < Math.PI/2) {
        carContext.translate(startPos.x * (tileLength + lineWidth) + lineWidth/2, startPos.y * (tileLength + lineWidth) + lineWidth/2);
        carContext.translate(compass[(startDir + 1)%4].x * (tileLength + lineWidth), compass[(startDir + 1)%4].y * (tileLength + lineWidth));
        carContext.rotate(radian + speed * Math.PI/200);
        carContext.translate(-compass[(startDir + 1)%4].x * (tileLength + lineWidth), -compass[(startDir + 1)%4].y * (tileLength + lineWidth));
        rotateCar(carContext, startDir);
        carContext.drawImage(imgCar, -carWidth/2, -carHeight/2);
        carContext.restore();

        // 주유소 처리
        if (getGas > 0 && radian + speed * Math.PI/200 > Math.PI/4) {
            await fueling(getGas);
            getGas = 0;
            pointList[startPos.y + compass[startDir].y][startPos.x + compass[startDir].x].element.gas = 0;
            turn++;
            setAfterMove();
        }

        console.log(radian);
        await delay(5)
        await rightForwardAnimation(carCanvas, carContext, startPos, startDir, radian + speed * Math.PI/200);
    }
    else {
        carContext.translate(car.pos.x * (tileLength + lineWidth) + lineWidth/2, car.pos.y * (tileLength + lineWidth) + lineWidth/2);
        rotateCar(carContext);
        carContext.drawImage(imgCar, -carWidth/2, -carHeight/2);
        carContext.restore();
    }
}

async function leftBackwardAnimation(carCanvas, carContext, startPos, startDir, radian = 0) {
    carContext.clearRect(0, 0, carCanvas.width, carCanvas.height);
    carContext.save();
    if (radian + speed * Math.PI/200 < Math.PI/2) {
        carContext.translate(startPos.x * (tileLength + lineWidth) + lineWidth/2, startPos.y * (tileLength + lineWidth) + lineWidth/2);
        carContext.translate(compass[(startDir+3)%4].x, compass[(startDir+3)%4].y);
        carContext.rotate(radian + speed * Math.PI/200);
        carContext.translate(-compass[(startDir+3)%4].x, -compass[(startDir+3)%4].y);
        rotateCar(carContext, startDir);
        carContext.drawImage(imgCar, -carWidth/2, -carHeight/2);
        carContext.restore();

        // 주유소 처리
        if (getGas > 0 && radian + speed * Math.PI/200 > Math.PI/4) {
            await fueling(getGas);
            getGas = 0;
            pointList[startPos.y + compass[startDir].y][startPos.x + compass[startDir].x].element.gas = 0
            turn++;
            setAfterMove();
        }

        console.log(radian);
        await delay(5)
        await leftBackwardAnimation(carCanvas, carContext, startPos, startDir, radian + speed * Math.PI/200);
    }
    else {
        carContext.translate(car.pos.x * (tileLength + lineWidth) + lineWidth/2, car.pos.y * (tileLength + lineWidth) + lineWidth/2);
        rotateCar(carContext);
        carContext.drawImage(imgCar, -carWidth/2, -carHeight/2);
        carContext.restore();
    }
}

async function rightBackwardAnimation(carCanvas, carContext, startPos, startDir, radian = 0) {
    carContext.clearRect(0, 0, carCanvas.width, carCanvas.height);
    carContext.save();
    if (radian + speed * Math.PI/200 < Math.PI/2) {
        carContext.translate(startPos.x * (tileLength + lineWidth) + lineWidth/2, startPos.y * (tileLength + lineWidth) + lineWidth/2);
        carContext.translate(compass[(startDir+1)%4].x * (tileLength + lineWidth), compass[(startDir+1)%4].y * (tileLength + lineWidth));
        carContext.rotate(-(radian + speed * Math.PI/200));
        carContext.translate(-compass[(startDir+1)%4].x * (tileLength + lineWidth), -compass[(startDir+1)%4].y * (tileLength + lineWidth));
        rotateCar(carContext, startDir);
        carContext.drawImage(imgCar, -carWidth/2, -carHeight/2);
        carContext.restore();

        // 주유소 처리
        if (getGas > 0 && radian + speed * Math.PI/200 > Math.PI/4) {
            await fueling(getGas);
            getGas = 0;
            pointList[startPos.y + compass[startDir].y][startPos.x + compass[startDir].x].element.gas = 0
            turn++;
            setAfterMove();
        }

        console.log(radian);
        await delay(5)
        await rightBackwardAnimation(carCanvas, carContext, startPos, startDir, radian + speed * Math.PI/200);
    }
    else {
        carContext.translate(car.pos.x * (tileLength + lineWidth) + lineWidth/2, car.pos.y * (tileLength + lineWidth) + lineWidth/2);
        rotateCar(carContext);
        carContext.drawImage(imgCar, -carWidth/2, -carHeight/2);
        carContext.restore();
    }
}

async function stayAnimation(time = 0) {
    if (time < 100) {
        await delay(5);
        await stayAnimation(time + speed);
    }
}

async function honkAnimation(startPos, startDir) {
    hornSound.play();

    let time = 0;
    const objectPoint = pointList[startPos.y + compass[startDir].y][startPos.x + compass[startDir].x];

    while (time < 100) {
        if (time > 50 && objectPoint.elementType == someObject && objectPoint.element.exist != 0) { // **** 수정
            someObjectAnimation(objectPoint.pos, objectPoint.element.something);
            objectPoint.element.exist = 0;
        }
        await delay(5);
        time += speed;
    }
}

function createCar(carCanvas) {
    const carContext = carCanvas.getContext("2d");
    carContext.clearRect(0, 0, carCanvas.width, carCanvas.height);
    carContext.save();
    carContext.translate(car.pos.x * (tileLength + lineWidth) + lineWidth/2, car.pos.y * (tileLength + lineWidth) + lineWidth/2);
    rotateCar(carContext);
    carContext.drawImage(imgCar, -carWidth/2, -carHeight/2);
    carContext.restore();
    console.log("차 생성")
}

function initCar() {
    const carCanvas = document.getElementById("carImgCanvas");
    car.pos.x = startingPos.x;
    car.pos.y = startingPos.y;
    car.dir = startingDirection

	fuel = startingFuel;
	updateFuel();
    createCar(carCanvas);
}

async function carAnimation(dir, startPos, startDir) {
    const carCanvas = document.getElementById("carImgCanvas");
    const carContext = carCanvas.getContext("2d");

    switch (dir) {
        case forward: // 전진
            await forwardAnimation(carCanvas, carContext, startPos, startDir);
            break;
        case leftForward:
            await leftForwardAnimation(carCanvas, carContext, startPos, startDir);
            break;
        case rightForward:
            await rightForwardAnimation(carCanvas, carContext, startPos, startDir);
            break;
        case backward:
            await backwardAnimation(carCanvas, carContext, startPos, startDir);
            break;
        case leftBackward:
            await leftBackwardAnimation(carCanvas, carContext, startPos, startDir);
            break;
        case rightBackward:
            await rightBackwardAnimation(carCanvas, carContext, startPos, startDir);
            break;
        case stay:
            await stayAnimation();
            break;
        case honk:
            await honkAnimation(startPos, startDir);
            break;
    }
}

async function moveCar(dir) {
    const startPos = {x: car.pos.x, y: car.pos.y};
    const startDir = car.dir;
    calPos(dir);

    await carAnimation(dir, startPos, startDir);
}

// 방향별 실패시 애니메이션 추가

function getCarDir() {
    return compass[car.dir];
}

function getCarPos() {
    return car.pos;
}

function getNextPos(dir) {
    let pos = {x : car.pos.x, y : car.pos.y};

    switch(dir) {
        case forward:
            pos.x = pos.x + 2 * compass[car.dir].x;
            pos.y = pos.y + 2 * compass[car.dir].y;
            break;
        case backward:
            pos.x = pos.x - 2 * compass[car.dir].x;
            pos.y = pos.y - 2 * compass[car.dir].y;
            break;
        case leftForward:
            pos.x = pos.x + compass[car.dir].x + compass[(car.dir+3)%4].x;
            pos.y = pos.y + compass[car.dir].y + compass[(car.dir+3)%4].y;
            break;
        case rightForward:
            pos.x = pos.x + compass[car.dir].x + compass[(car.dir+1)%4].x;
            pos.y = pos.y + compass[car.dir].y + compass[(car.dir+1)%4].y;
            break;
        case leftBackward:
            pos.x = pos.x - compass[car.dir].x - compass[(car.dir+1)%4].x;
            pos.y = pos.y - compass[car.dir].y - compass[(car.dir+1)%4].y;
            break;
        case rightBackward:
            pos.x = pos.x - compass[car.dir].x - compass[(car.dir+3)%4].y;
            pos.y = pos.y - compass[car.dir].x - compass[(car.dir+3)%4].x;
            break;
        case stay:
            break;

    }
    return pos;
}

function resetGame(){
    gridOn = false;
    gameOver = false;
    gameOverText = null;
    turn = 0;

	initPoint();
	initCar(); // 자동차 데이터 설정, 그리기

	drawElement();
}

// 다음 포인트를 반환
function nextPos(dir) {
    return getNextPos(dir);
}

// 다음 블록이 갈 수 있는지 판단하는 함수
function canGoTo(dir) {
    if (pointList[nextPos(dir).y][nextPos(dir).x].isLocatable == 1) {
        return true;
    } else {
        return false;
    }
}

async function checkGoal() { // 코드가 실행된 뒤 마지막에 결과를 확인하는 함수
    if (block_isCarIn(goalPoint)) { // 2 == 골인지점
        // 골인 했을 때 실행할 것
		$.ajax({
			url : "/game/clear.do",
			type:"post",
			success:function(res){
				if(res == "success"){
					$("#successModal").modal("show");
					$("#passMark").removeClass("d-none");
					resetGame();
				}
				else if(res == "fail"){
					alert("서버에 오류가 발생했습니다.");
					location.reload();
				}
			}
		});
    } else {
		if(gameOverText == null){
			gameOverText = "도착하지 못했습니다.";
		}
		$("#gameOverMsg").text(gameOverText);
		$("#failModal").modal("show");
		resetGame();
    }
}

// 블록의 시작에 필요한 함수
function readyBeforeMove(dir) {
    turn++;
    // 다음 위치가 갈 수 있는 곳인지 판단
    if(!canGoTo(dir)) {
        gameOver = true;
        gameOverText = '갈 수 없는 곳입니다.';
    }
	else{
        if (dir != stay && dir != honk) {
            // 앞 요소에 걸리는지 판단
            const point = pointList[car.pos.y + compass[car.dir].y][car.pos.x + compass[car.dir].x];
            switch (point.elementType) {
                case trafficLight:
                    if (point.element.getColor() == 2) {
                        gameOver = true;
                        gameOverText = '빨간불에는 건널 수 없습니다.'
                    }
                    break;
                case gasStation:
                    if (point.element.gas > 0) {
                        getGas = point.element.gas;
                    }
                    break;
                case someObject:
                    if (point.element.exist != 0) {
                        gameOver = true;
                        gameOverText = '무언가를 치었습니다.'
                    }
                    break;
            }
        }
	}
}
// 블록의 끝에 필요한 함수
function setAfterMove() {
    // 게임오버 조건 확인
    // 연료 확인
    if (fuel == 0 && !block_isCarIn(goalPoint)) {
        gameOver = true;
        gameOverText = '연료가 바닥났습니다.';
    }

	// 맵 요소 상태 변경
    for (let y = 0; y < mapHeight + 1; y++) {
        for (let x = 0; x < mapWidth + 1; x++) {
            if (pointList[y][x].element != null) {
                console.log("element가 null이 아님");
                switch (pointList[y][x].elementType) {
                    case trafficLight:
                        console.log("nextState() 호출");
                        pointList[y][x].element.nextState();
                        break;
                }
            }
        }
    }

    drawElement();
}

async function action(dir) {
    if(!gameOver){
	    readyBeforeMove(dir);
	    await moveCar(dir);
	    if (dir != stay || dir != honk) {
			fuel -= 1;
			updateFuel();
		}
        setAfterMove();
	}
}

async function block_forward() {
    await action(forward);
}

async function block_leftForward() {
    await action(leftForward);
}

async function block_rightForward() {
    await action(rightForward);
}

async function block_backward() {
    await action(backward);
}

async function block_leftBackward() {
    await action(leftBackward);
}

async function block_rightBackward() {
    await action(rightBackward);
}

async function block_stay() {
    await action(stay);
}

async function block_honk() {
    await action(honk);
}

function block_frontOfCar(elementType) { // 인자에 해당하는 요소가 앞에 있다면 true 없다면 false
	console.log(car.pos.x,car.pos.y)
    if (elementType == pointList[car.pos.y + compass[car.dir].y][car.pos.x + compass[car.dir].x].elementType) {
        return true;
    }
    return false;
}

function block_isRedLight() {
    const point = pointList[car.pos.y + compass[car.dir].y][car.pos.x + compass[car.dir].x];
    if (trafficLight == point.elementType && point.element.color == 2) {
        return true;
    }
    return false;
}

function block_canGoTo(dir) {
    const next = nextPos(dir);
    const result = pointList[next.y][next.x].isLocatable;

    return result;
}

function block_getFuel() { // 남은 연료 반환
    return fuel;
}

function block_isCarIn(elementType) { // 현재
    if (pointList[car.pos.y][car.pos.x].elementType == elementType) {
        return true;
    } else {
        return false;
    }
}

function block_directionForward() { // 전진 번호 출력
    return forward;
}

function block_directionLeftForword() { // 좌회전 번호 출력
    return leftForward;
}

function block_directionRightForword() { // 우회전 번호 출력
    return rightForward;
}

function block_directionBackword() { // 후진 번호 출력
    return backward;
}

function block_directionLeftbackward() { // 좌후진 번호 출력
    return leftBackward;
}

function block_directionRightBackword() { // 우후진 번호 출력
    return rightBackward;
}

function block_directionStay() { // 대기 번호 출력
    return stay;
}

function block_startingPoint() {
    return startingPoint;
}

function block_goalPoint() {
    return goalPoint;
}

function block_trafficLight() {
    return trafficLight;
}