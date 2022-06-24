/**
 * TextAlive App API phrase example
 * https://github.com/TextAliveJp/textalive-app-phrase
 *
 * 発声中の歌詞をフレーズ単位で表示します。
 * また、このアプリが TextAlive ホストと接続されていなければ再生コントロールを表示します。
 * 
 * より詳しいコメントがついた網羅的なサンプルコードは https://github.com/TextAliveJp/textalive-app-basic にあります。
 * `script` タグで API を読み込むサンプルコードは https://github.com/TextAliveJp/textalive-app-script-tag にあります。
 */

import { Player, Ease } from "textalive-app-api";

let allphrase = null;
let allchar = null;
let startchar = null;
let endchar = null;
let startphrase = null;
let endphrase = null;
let pos = 0;

SpeechRecognition = webkitSpeechRecognition || SpeechRecognition;
let recognition = new SpeechRecognition();
recognition.lang = 'ja-JP';



const player = new Player({
	app: {
		// トークンは https://developer.textalive.jp/profile で取得したものを使う
		token: "USO4oJq6S7r0N3ah"
	},
	//右下消せる
	
});

player.addListener({
	onAppReady,
	onTimerReady,
	onTimeUpdate,
	onThrottledTimeUpdate
});


const playBtn = document.querySelector("#play");
const jumpBtn = document.querySelector("#jump");
const pauseBtn = document.querySelector("#pause");
const rewindBtn = document.querySelector("#rewind");
const positionEl = document.querySelector("#position strong");
const artistSpan = document.querySelector("#artist span");
const songSpan = document.querySelector("#song span");
const phraseEl = document.querySelector("#container p");
const phraseE2 = document.querySelector("#container2 p");
const phraseE3 = document.querySelector("#container3 p");
const beatbarEl = document.querySelector("#beatbar");
const startBtn = document.querySelector('#start-btn');
const stopBtn = document.querySelector('#stop-btn');


function onAppReady(app) {
	if (!app.managed) {
		document.querySelector("#control").style.display = "block";
		playBtn.addEventListener("click", () => player.video && player.requestPlay());
		jumpBtn.addEventListener("click", () => player.video && player.requestMediaSeek(player.video.firstPhrase.startTime));
		pauseBtn.addEventListener("click", () => player.video && player.requestPause());
		rewindBtn.addEventListener("click", () => player.video && player.requestMediaSeek(0));
	}
	if (!app.songUrl) {
		// blues / First Note
		
		// 未完のストーリー / 加賀（ネギシャワーP） feat. 初音ミク
		player.createFromSongUrl("https://piapro.jp/t/ehtN/20220207101534", {
			video: {
		// 音楽地図訂正履歴: https://songle.jp/songs/2245017/history
			beatId: 4083459,
			chordId: 2222147,
			repetitiveSegmentId: 2248008,
			// 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/piapro.jp%2Ft%2FehtN%2F20220207101534
			lyricId: 53747,
			lyricDiffId: 7083
			},
		});
		
		/*
		player.createFromSongUrl("https://piapro.jp/t/RoPB/20220122172830", {
			video: {
				// 音楽地図訂正履歴: https://songle.jp/songs/2243651/history
				beatId: 4086301,
				chordId: 2221797,
				repetitiveSegmentId: 2247682,
				// 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/piapro.jp%2Ft%2FRoPB%2F20220122172830
				lyricId: 53718,
				lyricDiffId: 7076,
			},
		});
		*/
	}
}

function onTimerReady() {
	artistSpan.textContent = player.data.song.artist.name;
	songSpan.textContent = player.data.song.name;
	
	document
		.querySelectorAll("button")
		.forEach((btn) => (btn.disabled = false));
	
	startphrase = [];
	endphrase = [];
	allphrase = [];
	
	
	//フレーズ
	
	let p = player.video.firstPhrase;
	jumpBtn.disabled = !p;
	// set `animate` method
	while (p && p.next) {
		//console.log(p.text);
		//console.log(p.startTime);
		//console.log(p.endTime);
		allphrase.push(p.text);
		startphrase.push(p.startTime);
		endphrase.push(p.endTime);
		p.animate = animatePhrase;
		p = p.next;
	}
	
	allphrase.push(p.text);
	startphrase.push(p.startTime);
	endphrase.push(p.endTime);
	p.animate = animatePhrase;
	
	//単語
	
	let q = player.video.firstChar;
	allchar = [];
	startchar = [];
	endchar = [];
	while(q && q.next){
		startchar.push(q.startTime);
		endchar.push(q.endTime);
		allchar.push(q.text);
		q = q.next;
	}
	
	startchar.push(q.startTime);
	endchar.push(q.endTime);
	allchar.push(q.text);
	
	
	/*
	
	for(let i = 0; i <= allchar.length; i++){
		if(startchar[i] > 55000){
			console.log(allchar[i]);
			console.log(startchar[i]);
			console.log(endchar[i]);
		}
	}
	
	for(let i = 0; i < allphrase.length; i++){
		console.log(allphrase[i]);
		console.log(startphrase[i]);
		console.log(endphrase[i]);
	}
	
	*/
}

let count = 0;
let allpos = 0;
let sing;
let webspeech;
let prev_end;
let prev_start;
let time_step = 3000;
function onTimeUpdate(position) {
	
	//ブクマのやつ使えば位置もランダムに変えられるとか？
	
	//こいつコメントアウトすると途中結果を吐き出さない
	//recognition.interimResults = true;
	
	
	//こいつコメントアウトすると数秒で認識消える
	//recognition.continuous = true;
	
	//一定時間ごとにwebspeechAPIのボタンが表示される
	if(position > time_step){
		document.getElementById("start-btn").style.visibility = "visible";
	}
	
	webspeech = [];
	
	recognition.onresult = (event) => {
		let interimTranscript = ''; // 暫定(灰色)の認識結果
		//console.log(event.results[0][0].transcript);
		webspeech = event.results[0][0].transcript;
		phraseE3.textContent = webspeech;
		recognition.stop();
	}
	
	startBtn.onclick = () => {
		recognition.start();
		document.getElementById("start-btn").style.visibility = "hidden";
		//一度発声したら10秒間ボタン表示されない
		time_step = position + 10000;
		console.log("time",time_step);
	 }
	stopBtn.onclick = () => {
		recognition.stop();
	}
	
	// show beatbar
	const beat = player.findBeat(position);
	if (!beat) {
		return;
	}
	beatbarEl.style.width = `${Math.ceil(Ease.circIn(beat.progress(position)) * 100)}%`;
	
	if(allpos == 0){
		sing = [];
		phraseE2.textContent = sing;
	}
	
	if(endphrase[count] < position && allpos != 0){
		//console.log("blue empty!");
		sing = [];
		++count;
	}
	
	if(startphrase[count] <= position && endphrase[count] >= position){
		//console.log("start:%f end:%f position:%f", startchar[allpos], endchar[allpos], position);
		
		if(startchar[allpos] <= position && startchar[allpos] == endchar[allpos]){
			//同じ時間に連続で歌詞が格納される
			prev_start = startchar[allpos];
			prev_end = endchar[allpos];
			while(startchar[allpos] == prev_end){
				sing += allchar[allpos];
				++allpos;
			}
			phraseE2.style.color = "rgb(175,223,228)";
			phraseE2.textContent = sing;
		}
		else if(startchar[allpos] <= position && endchar[allpos] >= position){
			//歌詞格納（通常）
			//console.log(allchar[allpos]);
			prev_start = startchar[allpos];
			prev_end = endchar[allpos];
			sing += allchar[allpos];
			++allpos;
			//console.log(sing);
			//phraseE2.style.color = "blue";
			phraseE2.style.color = "rgb(175,223,228)";
			phraseE2.textContent = sing;
		}
		
		while(startchar[allpos] <= position  && startchar[allpos] + 100 > endchar[allpos]){
			//上2つで拾えない歌詞を拾う
			prev_start = startchar[allpos];
			sing += allchar[allpos];
			++allpos;
			phraseE2.style.color = "rgb(175,223,228)";
			phraseE2.textContent = sing;
		}
	}
}

function onThrottledTimeUpdate(position) {
	positionEl.textContent = String(Math.floor(position));
}

function animatePhrase(now, unit) {
	// show current phrase
	if (unit.contains(now)) {
		phraseEl.textContent = unit.text;
	}
};

