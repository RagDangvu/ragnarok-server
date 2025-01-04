document.addEventListener('DOMContentLoaded', () => {  
const userGrid = document.querySelector('.grid-user')
  const computerGrid = document.querySelector('.grid-computer')
  const displayGrid = document.querySelector('.grid-display')
  const ships = document.querySelectorAll('.ship')
  const destroyer = document.querySelector('.destroyer-container')
  const frigate = document.querySelector('.frigate-container')
  const cruiser = document.querySelector('.cruiser-container')
  const battleship = document.querySelector('.battleship-container')
  const leviathan = document.querySelector('.leviathan-container')
  const startButton = document.querySelector('#start')
  const rotateButton = document.querySelector('#rotate')
  const turnDisplay = document.querySelector('#whose-go')
  const infoDisplay = document.querySelector('#info')
  const setupButtons = document.getElementById('setup-buttons')
const newGameBtn = document.querySelector('#new-game');
  const userSquares = []
  const computerSquares = []
  let isHorizontal = true
  let isGameOver = false
  let currentPlayer = 'user'
  const width = 13
  let playerNum = 0
  let ready = false
  let enemyReady = false
  let allShipsPlaced = false
  let shotFired = -1
let rocketCount = 3;
let rocketMode = false;
let computerRocketCount = 3;
let isMuted = false;
const rocketBtn = document.querySelector('#rocket-btn');
const muteBtn = document.getElementById('mute-btn');
  if (muteBtn) {
    muteBtn.addEventListener('click', toggleSound);
  }

const rotateScreenBtn = document.getElementById('rotate-screen-btn');
if (rotateScreenBtn) {
  rotateScreenBtn.addEventListener('click', () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
    
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape')
        .catch(err => {
          console.log('Không thể xoay màn hình:', err);
          // Hiển thị hướng dẫn nếu không thể tự động xoay
          alert('Please rotate your device manually to landscape mode for better gameplay experience.');
        });
    } else {
      // Fallback cho các trình duyệt không hỗ trợ orientation lock
      alert('Please rotate your device manually to landscape mode for better gameplay experience.');
    }
  });
}
  
// Khai báo âm thanh
const sounds = {
  start: new Audio('./sounds/sound1.mp3'),
  miss: new Audio('./sounds/sound2.mp3'),
  hit: new Audio('./sounds/sound3.mp3'),
  destroy: new Audio('./sounds/sound4.mp3'),
  gameOver: new Audio('./sounds/sound5.mp3')

}

function playSound(sound) {
  if (!isMuted) {
    sound.currentTime = 0;
    sound.play();
  }
}

function toggleSound() {
  isMuted = !isMuted;
  const muteBtn = document.getElementById('mute-btn');
  muteBtn.innerHTML = isMuted ? '🔇' : '🔊';
  
  Object.values(sounds).forEach(sound => {
    sound.muted = isMuted;
  });
}

function handleSquareClick(e) {
    if (currentPlayer === 'user' && !isGameOver) {
        shotFired = e.target.dataset.id
        revealSquare(e.target.classList)
    }
}

function shouldUseRocket() {
  return computerRocketCount > 0 && Math.random() < 0.3;
}

async function computerRocketShot() {
  let centerSquare;
  do {
    centerSquare = Math.floor(Math.random() * userSquares.length);
  } while (
    userSquares[centerSquare].classList.contains('boom') || 
    userSquares[centerSquare].classList.contains('miss')
  );

  const adjacentSquares = [
    centerSquare,
    centerSquare - width,
    centerSquare + width,
    centerSquare - 1,
    centerSquare + 1
  ];

  const validSquares = adjacentSquares.filter(square => {
    if (square < 0 || square >= width * width) return false;
    if (centerSquare % width === 0 && square === centerSquare - 1) return false;
    if (centerSquare % width === width - 1 && square === centerSquare + 1) return false;
    return !userSquares[square].classList.contains('boom') && 
           !userSquares[square].classList.contains('miss');
  });

  let hitFound = false;

  for (const square of validSquares) {
    const targetSquare = userSquares[square];
    const isHit = targetSquare.classList.contains('taken');

    if (isHit) {
      targetSquare.classList.add('boom', 'rocket-hit');
      hitFound = true;
      
      if (targetSquare.classList.contains('destroyer')) cpuDestroyerCount++;
      if (targetSquare.classList.contains('frigate')) cpuFrigateCount++;
      if (targetSquare.classList.contains('cruiser')) cpuCruiserCount++;
      if (targetSquare.classList.contains('battleship')) cpuBattleshipCount++;
      if (targetSquare.classList.contains('leviathan')) cpuLeviathanCount++;
      
      await playSound(sounds.hit);
    } else {
      targetSquare.classList.add('miss');
    }
  }

  if (hitFound) {
    await playSound(sounds.destroy);
  } else {
    await playSound(sounds.miss);
  }

  computerRocketCount--;
  await checkForWins();
}

  //Ships
  const shipArray = [
    {
      name: 'destroyer',
      directions: [
        [0, 1],
        [0, width]
      ]
    },
    {
      name: 'frigate',
      directions: [
        [0, 1, 2],
        [0, width, width*2]
      ]
    },
    {
      name: 'cruiser',
      directions: [
        [0, 1, 2],
        [0, width, width*2]
      ]
    },
    {
      name: 'battleship',
      directions: [
        [0, 1, 2, 3],
        [0, width, width*2, width*3]
      ]
    },
    {
      name: 'leviathan',
      directions: [
        [0, 1, 2, 3, 4],
        [0, width, width*2, width*3, width*4]
      ]
    },
  ]

  createBoard(userGrid, userSquares)
  createBoard(computerGrid, computerSquares)

  // Select Player Mode
if (gameMode === 'singlePlayer') {
  startSinglePlayer();
} else {
  // Khởi tạo socket với thông tin phòng
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.get('room')) {
    window.location.href = '/create-room.html';
    return;
  }

  // Khởi tạo socket với thông tin phòng
  const socket = io({
    query: {
      roomId: urlParams.get('room'),
      username: urlParams.get('username')
    }
  });

    // Log kết nối
    socket.on('connect', () => {
    console.log('Connected to server');
    const playerElements = document.querySelectorAll('.player .connected');
    playerElements[0].classList.add('active');
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });

  socket.on('room-full', () => {
    alert('This room is full! Redirecting to create room page...');
    window.location.href = '/create-room.html';
  });

  startMultiPlayer(socket);
}

  // Multiplayer
  function startMultiPlayer(socket) {
    // Get your player number
socket.on('player-info', ({ players }) => {
    console.log('Received player info:', players);
    const p1Name = document.querySelector('.p1 .player-name');
    const p2Name = document.querySelector('.p2 .player-name');
    
    if (players[0]) {
      p1Name.textContent = players[0].username;
    }
    if (players[1]) {
      p2Name.textContent = players[1].username;
    }
  });

// Tự động đặt tàu cho người chơi
  const userShips = [
    {name: 'destroyer', length: 2},
    {name: 'frigate', length: 3},
    {name: 'cruiser', length: 3},
    {name: 'battleship', length: 4},
    {name: 'leviathan', length: 5}
  ];

  userShips.forEach(ship => {
    autoPlaceShip(ship, userSquares);
  });
  
  // Đánh dấu đã đặt xong tàu
  allShipsPlaced = true;

  // Get your player number
  socket.on('player-info', ({ players }) => {
    console.log('Received player info:', players);
    const p1Name = document.querySelector('.p1 .player-name');
    const p2Name = document.querySelector('.p2 .player-name');
    
    if (players[0]) {
      p1Name.textContent = players[0].username;
    }
    if (players[1]) {
      p2Name.textContent = players[1].username;
    }
  });

  // Xử lý số người chơi
  socket.on('player-number', num => {
    console.log('Received player number:', num);
    if (num === -1) {
      infoDisplay.innerHTML = "This room is full";
      window.location.href = '/create-room.html';
    } else {
      playerNum = parseInt(num);
      if (playerNum === 1) currentPlayer = "enemy";
      socket.emit('check-players');
    }
  });

  // Xử lý kết nối/ngắt kết nối của người chơi
  socket.on('player-connection', num => {
    console.log(`Player number ${num} has connected or disconnected`);
    playerConnectedOrDisconnected(num);
  });

  // Xử lý khi đối thủ sẵn sàng
  socket.on('enemy-ready', num => {
    enemyReady = true;
    playerReady(num);
    if (ready) {
      playGameMulti(socket);
      setupButtons.style.display = 'none';
    }
  });

  // Kiểm tra trạng thái người chơi
  socket.on('check-players', players => {
    players.forEach((p, i) => {
      if (p.connected) playerConnectedOrDisconnected(i);
      if (p.ready) {
        playerReady(i);
        if (i !== playerNum) enemyReady = true;
      }
    });
  });

  // Xử lý hết thời gian
  socket.on('timeout', () => {
    infoDisplay.innerHTML = 'You have reached the 10 minute limit';
  });

  // Nút Start
  startButton.addEventListener('click', () => {
    socket.emit('player-ready');
    ready = true;
    playerReady(playerNum);
    
    if (enemyReady) {
      playGameMulti(socket);
      setupButtons.style.display = 'none';
    }
  });

  // Trong hàm startMultiPlayer:

  // Setup event listeners for firing
  computerSquares.forEach(square => {
    square.addEventListener('click', () => {
      if (currentPlayer === 'user' && ready && enemyReady) {
        if (rocketMode && rocketCount > 0) {
          // Xử lý rocket shot
          let centerIndex = parseInt(square.dataset.id);
          socket.emit('fire-rocket', {
            center: centerIndex,
            squares: getAdjacentSquares(square)
          });
          
          // Cập nhật UI rocket
          rocketCount--;
          document.getElementById('rocket-count').textContent = `🚀 x${rocketCount}`;
          rocketMode = false;
          rocketBtn.style.backgroundColor = '#4a90e2';
          if (rocketCount === 0) {
            rocketBtn.disabled = true;
          }
        } else if (!square.classList.contains('boom') && !square.classList.contains('miss')) {
          shotFired = square.dataset.id;
          socket.emit('fire', shotFired);
        }
      }
    });
  });

  // Thêm xử lý rocket events
  socket.on('fire-rocket', data => {
    // Xử lý khi bị bắn rocket
    const affectedSquares = data.squares.map(index => {
      const square = userSquares[index];
      const hit = square.classList.contains('taken');
      
      if (!square.classList.contains('boom') && !square.classList.contains('miss')) {
        if (hit) {
          if (square.classList.contains('destroyer')) cpuDestroyerCount++;
          if (square.classList.contains('frigate')) cpuFrigateCount++;
          if (square.classList.contains('cruiser')) cpuCruiserCount++;
          if (square.classList.contains('battleship')) cpuBattleshipCount++;
          if (square.classList.contains('leviathan')) cpuLeviathanCount++;
          square.classList.add('boom');
          playSound(sounds.hit);
        } else {
          square.classList.add('miss');
          playSound(sounds.miss);
        }
      }
      
      return {
        index: index,
        classes: Array.from(square.classList)
      };
    });

    socket.emit('fire-rocket-reply', affectedSquares);
    checkForWins();
    currentPlayer = 'user';
    turnDisplay.innerHTML = 'Your Turn';
    playGameMulti(socket);
  });

  socket.on('fire-rocket-reply', results => {
    // Xử lý kết quả bắn rocket
    results.forEach(result => {
      const square = computerGrid.querySelector(`div[data-id='${result.index}']`);
      if (result.classes.includes('taken')) {
        square.classList.add('boom', 'rocket-hit');
        if (result.classes.includes('destroyer')) destroyerCount++;
        if (result.classes.includes('frigate')) frigateCount++;
        if (result.classes.includes('cruiser')) cruiserCount++;
        if (result.classes.includes('battleship')) battleshipCount++;
        if (result.classes.includes('leviathan')) leviathanCount++;
      } else {
        square.classList.add('miss');
      }
    });

    // Phát âm thanh dựa trên kết quả
    if (results.some(r => r.classes.includes('taken'))) {
      playSound(sounds.destroy);
    } else {
      playSound(sounds.miss);
    }

    checkForWins();
    currentPlayer = 'enemy';
    turnDisplay.innerHTML = "Enemy's Turn";
    playGameMulti(socket);
  });

// Xử lý bắn thường
  socket.on('fire', id => {
    enemyGo(id);
    const square = userSquares[id];
    if (!square.classList.contains('boom') && !square.classList.contains('miss')) {
      const hit = square.classList.contains('taken');
      square.classList.add(hit ? 'boom' : 'miss');
      if (hit) {
        playSound(sounds.hit);
        // Cập nhật số lượng tàu bị phá hủy
        if (square.classList.contains('destroyer')) cpuDestroyerCount++;
        if (square.classList.contains('frigate')) cpuFrigateCount++;
        if (square.classList.contains('cruiser')) cpuCruiserCount++;
        if (square.classList.contains('battleship')) cpuBattleshipCount++;
        if (square.classList.contains('leviathan')) cpuLeviathanCount++;
      } else {
        playSound(sounds.miss);
      }
    }
    socket.emit('fire-reply', square.classList);
    checkForWins();
    currentPlayer = 'user';
    turnDisplay.innerHTML = 'Your Turn';
    playGameMulti(socket);
  });

  // Xử lý phản hồi bắn thường
  socket.on('fire-reply', classList => {
    const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`);
    const obj = Object.values(classList);
    if (obj.includes('taken')) {
      enemySquare.classList.add('boom');
      playSound(sounds.hit);
      if (obj.includes('destroyer')) destroyerCount++;
      if (obj.includes('frigate')) frigateCount++;
      if (obj.includes('cruiser')) cruiserCount++;
      if (obj.includes('battleship')) battleshipCount++;
      if (obj.includes('leviathan')) leviathanCount++;
    } else {
      enemySquare.classList.add('miss');
      playSound(sounds.miss);
    }
    checkForWins();
    currentPlayer = 'enemy';
    turnDisplay.innerHTML = "Enemy's Turn";
    playGameMulti(socket);
  });
}

// Helper function for player connection status
function playerConnectedOrDisconnected(num) {
  let player = `.p${parseInt(num) + 1}`;
  document.querySelector(`${player} .connected`).classList.toggle('active');
  if (parseInt(num) === playerNum) {
    document.querySelector(player).style.fontWeight = 'bold';
  }
}

rocketBtn.addEventListener('click', () => {
    if (currentPlayer === 'user' && rocketCount > 0) {
        rocketMode = !rocketMode;
        rocketBtn.style.backgroundColor = rocketMode ? '#ff4c29' : '#4a90e2';
        infoDisplay.innerHTML = rocketMode ? 'Rocket mode activated! Select a target.' : '';
        
        // Thêm hoặc xóa hiệu ứng hover
        if (rocketMode) {
            addRocketHoverEffect();
        } else {
            removeRocketHoverEffect();
        }
    }
});

function addRocketHoverEffect() {
    computerSquares.forEach(square => {
        square.addEventListener('mouseenter', showRocketRadius);
        square.addEventListener('mouseleave', hideRocketRadius);
    });
}

function removeRocketHoverEffect() {
    computerSquares.forEach(square => {
        square.removeEventListener('mouseenter', showRocketRadius);
        square.removeEventListener('mouseleave', hideRocketRadius);
    });
}

function showRocketRadius(e) {
    if (!rocketMode || currentPlayer !== 'user') return;
    
    const square = e.target;
    const adjacentIndexes = getAdjacentSquares(square);
    
    // Thêm hiệu ứng cho ô trung tâm
    square.classList.add('rocket-target');
    
    // Thêm hiệu ứng cho các ô xung quanh
    adjacentIndexes.forEach(index => {
        const adjacentSquare = computerSquares[index];
        if (adjacentSquare && adjacentSquare !== square) {
            adjacentSquare.classList.add('rocket-adjacent');
        }
    });
}

function hideRocketRadius(e) {
    const square = e.target;
    const adjacentIndexes = getAdjacentSquares(square);
    
    // Xóa hiệu ứng cho ô trung tâm
    square.classList.remove('rocket-target');
    
    // Xóa hiệu ứng cho các ô xung quanh
    adjacentIndexes.forEach(index => {
        const adjacentSquare = computerSquares[index];
        if (adjacentSquare) {
            adjacentSquare.classList.remove('rocket-adjacent');
        }
    });
}

  // Single Player
  function startSinglePlayer() {
    const userShips = [
      {name: 'destroyer', length: 2},
      {name: 'frigate', length: 3},
      {name: 'cruiser', length: 3},
      {name: 'battleship', length: 4},
      {name: 'leviathan', length: 5}
    ];

    userShips.forEach(ship => {
      autoPlaceShip(ship, userSquares);
    });

    // Sinh tàu cho computer như cũ
    generate(shipArray[0]);
    generate(shipArray[1]);
    generate(shipArray[2]);
    generate(shipArray[3]);
    generate(shipArray[4]);

    startButton.addEventListener('click', () => {
      playSound(sounds.start);
      setupButtons.style.display = 'none';
      playGameSingle();
    });

rocketCount = 3;
    rocketMode = false;
    document.getElementById('rocket-count').textContent = `🚀 x${rocketCount}`;
    rocketBtn.disabled = false;
    rocketBtn.style.backgroundColor = '#4a90e2';
}

  //Create Board
  function createBoard(grid, squares) {
    for (let i = 0; i < width*width; i++) {
      const square = document.createElement('div')
      square.dataset.id = i
      grid.appendChild(square)
      squares.push(square)
    }
  }

  //Draw the computers ships in random locations
  function generate(ship) {
    let randomDirection = Math.floor(Math.random() * ship.directions.length)
    let current = ship.directions[randomDirection]
    let direction = randomDirection === 0 ? 1 : width
    let randomStart = Math.floor(Math.random() * (width * width - (ship.directions[0].length * direction)))

    const isTaken = current.some(index => {
        const square = computerSquares[randomStart + (index * direction)]
        return !square || square.classList.contains('taken')
    })

    const isAtRightEdge = current.some(index => (randomStart + index) % width === width - 1)
    const isAtLeftEdge = current.some(index => (randomStart + index) % width === 0)

    if (!isTaken && !isAtRightEdge && !isAtLeftEdge) {
        current.forEach(index => computerSquares[randomStart + (index * direction)].classList.add('taken', ship.name))
    } else {
        generate(ship)
    }
}
  


ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
    selectedShipNameWithIndex = e.target.id;
    console.log('Selected ship:', selectedShipNameWithIndex);
}));

function dragStart() {
    draggedShip = this;
    // Đếm số phần tử div thực sự thay vì tất cả các node
    draggedShipLength = Array.from(this.children).length;
    console.log('Dragging ship:', draggedShip.className, 'Length:', draggedShipLength);
}

  function dragOver(e) {
    e.preventDefault()
  }

  function dragEnter(e) {
    e.preventDefault()
  }

  function dragLeave() {
    // console.log('drag leave')
  }

function autoPlaceShip(ship, squares) {
    const width = 13;
    const isHorizontal = Math.random() < 0.5;
    
    while (true) {
      let randomStart = Math.floor(Math.random() * (width * width));
      let validPlacement = true;
      
      // Kiểm tra xem có thể đặt tàu tại vị trí này không
      for (let i = 0; i < ship.length; i++) {
        const currentPos = isHorizontal ? randomStart + i : randomStart + (i * width);
        const isAtRightEdge = isHorizontal && (randomStart % width) + ship.length > width;
        const isAtBottom = !isHorizontal && currentPos >= width * width;
        
        if (isAtRightEdge || isAtBottom || squares[currentPos]?.classList.contains('taken')) {
          validPlacement = false;
          break;
        }
      }
      
      if (validPlacement) {
        for (let i = 0; i < ship.length; i++) {
          const currentPos = isHorizontal ? randomStart + i : randomStart + (i * width);
          squares[currentPos].classList.add('taken', ship.name);
          squares[currentPos].classList.add(isHorizontal ? 'horizontal' : 'vertical');
          
          // Thêm classes cho đầu và đuôi tàu
          if (i === 0) squares[currentPos].classList.add('start');
          if (i === ship.length - 1) squares[currentPos].classList.add('end');
        }
        break;
      }
    }
  }

  // Game Logic for MultiPlayer
  function playGameMulti(socket) {
    setupButtons.style.display = 'none'
    if(isGameOver) return
    if(!ready) {
      socket.emit('player-ready')
      ready = true
      playerReady(playerNum)
    }

    if(enemyReady) {
      if(currentPlayer === 'user') {
        turnDisplay.innerHTML = 'Your Turn'
      }
      if(currentPlayer === 'enemy') {
        turnDisplay.innerHTML = "Enemy's Turn"
      }
    }
  }

  function playerReady(num) {
    let player = `.p${parseInt(num) + 1}`
    document.querySelector(`${player} .ready`).classList.toggle('active')
  }

function getAdjacentSquares(square) {
    const centerIndex = parseInt(square.dataset.id);
    const adjacent = [
        centerIndex,                // Center
        centerIndex - width,        // Top
        centerIndex + width,        // Bottom
        centerIndex - 1,           // Left
        centerIndex + 1            // Right
    ];

    // Lọc bỏ các ô không hợp lệ (ở biên)
    return adjacent.filter(index => {
        if (index < 0 || index >= width * width) return false;
        if (centerIndex % width === 0 && index === centerIndex - 1) return false;
        if (centerIndex % width === width - 1 && index === centerIndex + 1) return false;
        return true;
    });
}

  // Game Logic for Single Player
  function playGameSingle() {
    if (isGameOver) return
    if (currentPlayer === 'user') {
        turnDisplay.innerHTML = 'Your Turn'
        computerSquares.forEach(square => square.addEventListener('click', function(e) {
            shotFired = square.dataset.id
            revealSquare(square.classList)
        }))
    } else if (currentPlayer === 'enemy') {
        turnDisplay.innerHTML = 'Computer Turn'
        setTimeout(enemyGo, 1000)
    }
}

  let destroyerCount = 0
  let frigateCount = 0
  let cruiserCount = 0
  let battleshipCount = 0
  let leviathanCount = 0

  async function revealSquare(classList) {
if (rocketMode && currentPlayer === 'user' && rocketCount > 0) {
        await handleRocketShot(parseInt(shotFired));
        return;
    }    
    if (gameMode === 'singlePlayer') {
        const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`)
        const obj = Object.values(classList)
        if (!enemySquare.classList.contains('boom') && !enemySquare.classList.contains('miss') && currentPlayer === 'user' && !isGameOver) {
            if (obj.includes('taken')) {
                await playSound(sounds.hit)
                enemySquare.classList.add('boom')
                if (obj.includes('destroyer')) destroyerCount++
                if (obj.includes('frigate')) frigateCount++
                if (obj.includes('cruiser')) cruiserCount++
                if (obj.includes('battleship')) battleshipCount++
                if (obj.includes('leviathan')) leviathanCount++
            } else {
                await playSound(sounds.miss)
                enemySquare.classList.add('miss')
            }

            await checkForWins()
            if (!isGameOver) {
                currentPlayer = 'enemy'
                turnDisplay.innerHTML = 'Computer Turn'
                setTimeout(enemyGo, 1000)
            }
        }
    }
}

  let cpuDestroyerCount = 0
  let cpuFrigateCount = 0
  let cpuCruiserCount = 0
  let cpuBattleshipCount = 0
  let cpuLeviathanCount = 0

async function handleRocketShot(centerSquare) {
    const adjacentSquares = [
        centerSquare,                    // Center
        centerSquare - width,            // Top
        centerSquare + width,            // Bottom
        centerSquare - 1,                // Left
        centerSquare + 1                 // Right
    ];

    let hitFound = false;
    
    // Kiểm tra các ô có hợp lệ không
    const validSquares = adjacentSquares.filter(square => {
        if (square < 0 || square >= width * width) return false;
        
        // Kiểm tra biên trái và phải
        if (centerSquare % width === 0 && square === centerSquare - 1) return false;
        if (centerSquare % width === width - 1 && square === centerSquare + 1) return false;
        
        const targetSquare = computerGrid.querySelector(`div[data-id='${square}']`);
        return !targetSquare.classList.contains('boom') && 
               !targetSquare.classList.contains('miss');
    });

    // Xử lý từng ô hợp lệ
    for (const square of validSquares) {
        const targetSquare = computerGrid.querySelector(`div[data-id='${square}']`);
        const isHit = targetSquare.classList.contains('taken');

        if (isHit) {
            targetSquare.classList.add('boom', 'rocket-hit');
            hitFound = true;
            
            // Cập nhật số lượng tàu bị phá hủy
            if (targetSquare.classList.contains('destroyer')) destroyerCount++;
            if (targetSquare.classList.contains('frigate')) frigateCount++;
            if (targetSquare.classList.contains('cruiser')) cruiserCount++;
            if (targetSquare.classList.contains('battleship')) battleshipCount++;
            if (targetSquare.classList.contains('leviathan')) leviathanCount++;
            
            await playSound(sounds.hit);
        } else {
            targetSquare.classList.add('miss');
        }
    }

    if (hitFound) {
        await playSound(sounds.destroy);
    } else {
        await playSound(sounds.miss);
    }

    // Giảm số rocket và cập nhật UI
    rocketCount--;
    document.getElementById('rocket-count').textContent = `🚀 x${rocketCount}`;
    
    // Tắt rocket mode
    rocketMode = false;
    rocketBtn.style.backgroundColor = '#4a90e2';
    
    // Disable nút nếu hết rocket
    if (rocketCount === 0) {
        rocketBtn.disabled = true;
    }

    // Kiểm tra thắng thua
    await checkForWins();
    
    // Chuyển lượt
    if (!isGameOver) {
        currentPlayer = 'enemy';
        turnDisplay.innerHTML = 'Computer Turn';
        setTimeout(enemyGo, 1000);
    }
} 

async function enemyGo(square) {
  if (gameMode === 'singlePlayer' && currentPlayer === 'enemy') {
    if (shouldUseRocket()) {
      await computerRocketShot();
    } else {
      square = Math.floor(Math.random() * userSquares.length);
      
      while (userSquares[square].classList.contains('boom') || 
             userSquares[square].classList.contains('miss')) {
        square = Math.floor(Math.random() * userSquares.length);
      }
      
      const hit = userSquares[square].classList.contains('taken');
      userSquares[square].classList.add(hit ? 'boom' : 'miss');
      
      if (hit) {
        await playSound(sounds.hit);
        if (userSquares[square].classList.contains('destroyer')) cpuDestroyerCount++;
        if (userSquares[square].classList.contains('frigate')) cpuFrigateCount++;
        if (userSquares[square].classList.contains('cruiser')) cpuCruiserCount++;
        if (userSquares[square].classList.contains('battleship')) cpuBattleshipCount++;
        if (userSquares[square].classList.contains('leviathan')) cpuLeviathanCount++;
      } else {
        await playSound(sounds.miss);
      }
    }
    
    await checkForWins();
    if (!isGameOver) {
      currentPlayer = 'user';
      turnDisplay.innerHTML = 'Your Turn';
    }
  }
}

function markShipAsDestroyed(shipName, grid) {
  // Tìm tất cả các ô của tàu đã bị phá hủy
  const shipSquares = grid.querySelectorAll(`.${shipName}`);
  
  // Thêm class ship-destroyed cho từng ô
  shipSquares.forEach(square => {
    square.classList.add('ship-destroyed');
  });
}

  function checkForWins() {
    let enemy = 'computer'
    if(gameMode === 'multiPlayer') enemy = 'enemy'

    if (destroyerCount === 2) {
    sounds.destroy.play()
    infoDisplay.innerHTML = `You eliminated the ${enemy}'s Destroyer`
    markShipAsDestroyed('destroyer', computerGrid)
    destroyerCount = 10
  }
  if (frigateCount === 3) {
    sounds.destroy.play()
    infoDisplay.innerHTML = `You eliminated the ${enemy}'s Frigate`
    markShipAsDestroyed('frigate', computerGrid, userGrid)
    frigateCount = 10
  }
  if (cruiserCount === 3) {
    sounds.destroy.play()
    infoDisplay.innerHTML = `You eliminated the ${enemy}'s Cruiser`
    markShipAsDestroyed('cruiser', computerGrid, userGrid)
    cruiserCount = 10
  }
  if (battleshipCount === 4) {
    sounds.destroy.play()
    infoDisplay.innerHTML = `You eliminated the ${enemy}'s Battleship`
    markShipAsDestroyed('battleship', computerGrid, userGrid)
    battleshipCount = 10
  }
  if (leviathanCount === 5) {
    sounds.destroy.play()
    infoDisplay.innerHTML = `You eliminated the ${enemy}'s Leviathan`
    markShipAsDestroyed('leviathan', computerGrid, userGrid)
    leviathanCount = 10
  }

  // Kiểm tra tàu người chơi
  if (cpuDestroyerCount === 2) {
    sounds.destroy.play()
    infoDisplay.innerHTML = `${enemy} eliminated your Destroyer`
    markShipAsDestroyed('destroyer', userGrid)
    cpuDestroyerCount = 10
  }
  if (cpuFrigateCount === 3) {
    sounds.destroy.play()
    infoDisplay.innerHTML = `${enemy} eliminated your Frigate`
    markShipAsDestroyed('frigate', userGrid)
    cpuFrigateCount = 10
  }
  if (cpuCruiserCount === 3) {
    sounds.destroy.play()
    infoDisplay.innerHTML = `${enemy} eliminated your Cruiser`
    markShipAsDestroyed('cruiser', userGrid)
    cpuCruiserCount = 10
  }
  if (cpuBattleshipCount === 4) {
    sounds.destroy.play()
    infoDisplay.innerHTML = `${enemy} eliminated your Battleship`
    markShipAsDestroyed('battleship', userGrid)
    cpuBattleshipCount = 10
  }
  if (cpuLeviathanCount === 5) {
    sounds.destroy.play()
    infoDisplay.innerHTML = `${enemy} eliminated your Leviathan`
    markShipAsDestroyed('leviathan', userGrid)
    cpuLeviathanCount = 10
  }

  // Kiểm tra kết thúc game
  if ((destroyerCount + frigateCount + cruiserCount + battleshipCount + leviathanCount) === 50) {
    sounds.gameOver.play()
    infoDisplay.innerHTML = "YOU WIN"
    gameOver()
  }
  if ((cpuDestroyerCount + cpuFrigateCount + cpuCruiserCount + cpuBattleshipCount + cpuLeviathanCount) === 50) {
    sounds.gameOver.play()
    infoDisplay.innerHTML = `${enemy.toUpperCase()} WINS`
    gameOver()
  }
}

function resetGame() {
  // Reset các biến trạng thái
  isGameOver = false;
  currentPlayer = 'user';
  allShipsPlaced = false;
  shotFired = -1;
  
  // Reset điểm số
  destroyerCount = 0;
  frigateCount = 0;
  cruiserCount = 0;
  battleshipCount = 0;
  leviathanCount = 0;
  cpuDestroyerCount = 0;
  cpuFrigateCount = 0;
  cpuCruiserCount = 0;
  cpuBattleshipCount = 0;
  cpuLeviathanCount = 0;

  // Reset rocket
  rocketCount = 3;
  rocketMode = false;
  document.getElementById('rocket-count').textContent = `🚀 x${rocketCount}`;
  rocketBtn.disabled = false;
  rocketBtn.style.backgroundColor = '#4a90e2';

  // Xóa tất cả các class khỏi ô
  userSquares.forEach(square => {
    square.className = '';
  });
  computerSquares.forEach(square => {
    square.className = '';
  });

  // Reset thông báo
  infoDisplay.innerHTML = '';
  turnDisplay.innerHTML = 'Game Reset - Press Start to Play';

  // Ẩn nút new game
  newGameBtn.style.display = 'none';

  // Hiển thị lại nút start
  setupButtons.style.display = 'flex';

  // Setup lại game
  const userShips = [
    {name: 'destroyer', length: 2},
    {name: 'frigate', length: 3},
    {name: 'cruiser', length: 3},
    {name: 'battleship', length: 4},
    {name: 'leviathan', length: 5}
  ];

  // Tự động đặt lại tàu cho người chơi
  userShips.forEach(ship => {
    autoPlaceShip(ship, userSquares);
  });

  // Sinh lại tàu cho computer
  generate(shipArray[0]);
  generate(shipArray[1]);
  generate(shipArray[2]);
  generate(shipArray[3]);
  generate(shipArray[4]);

  // Thêm lại event listener cho nút start
  startButton.addEventListener('click', () => {
    playSound(sounds.start);
    setupButtons.style.display = 'none';
    playGameSingle();
  });
}

  function gameOver() {
  isGameOver = true;
  startButton.removeEventListener('click', playGameSingle);
  newGameBtn.style.display = 'block';
  // Thêm event listener cho nút New Game
  newGameBtn.addEventListener('click', resetGame);
}
})
