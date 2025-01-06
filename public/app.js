document.addEventListener('DOMContentLoaded', () => {
    const socket = io("https://ragnarok-server.onrender.com");
    const userGrid = document.querySelector('.grid-user');
    const computerGrid = document.querySelector('.grid-computer');
    const startButton = document.querySelector('#start');
    const infoDisplay = document.querySelector('#info');
    const turnDisplay = document.querySelector('#whose-go');
    const setupButtons = document.getElementById('setup-buttons');
    const newGameBtn = document.querySelector('#new-game');
    const rocketBtn = document.querySelector('#rocket-btn');
    const muteBtn = document.getElementById('mute-btn');
    let currentPlayer = 'user';
    let playerNum = 0;
    let ready = false;
    let enemyReady = false;
    let isGameOver = false;
    let allShipsPlaced = false;
    let rocketCount = 3;
    let rocketMode = false;
    const width = 13;
    const userSquares = [];
    const computerSquares = [];

    // Tạo bảng
    createBoard(userGrid, userSquares);
    createBoard(computerGrid, computerSquares);

    // Kết nối với server
    socket.on('connect', () => {
        console.log('Connected to server, socket ID:', socket.id);
        infoDisplay.innerHTML = "Connected to server. Waiting for players...";
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        infoDisplay.innerHTML = "Connection error. Please try again.";
    });

    socket.on('room-full', () => {
        alert('This room is full. Redirecting...');
        window.location.href = '/create-room.html';
    });

    // Nhận thông tin người chơi
    socket.on('player-info', ({ players }) => {
        updatePlayerInfo(players);
    });

    // Đối thủ đã sẵn sàng
    socket.on('enemy-ready', () => {
        enemyReady = true;
        infoDisplay.innerHTML = "Enemy is ready!";
        if (ready) startGameMulti();
    });

    // Xử lý khi bị bắn
    socket.on('fire', (data) => {
        const square = userSquares[data.id];
        handleEnemyFire(square, data.id);
    });

    socket.on('fire-reply', (data) => {
        updateEnemyFire(data);
    });

    // Nút Start
    startButton.addEventListener('click', () => {
        if (allShipsPlaced) {
            socket.emit('player-ready');
            ready = true;
            startButton.disabled = true;
            infoDisplay.innerHTML = "Waiting for opponent...";
            if (enemyReady) startGameMulti();
        } else {
            alert('Place all your ships first!');
        }
    });

    // Reset game
    newGameBtn.addEventListener('click', resetGame);

    function createBoard(grid, squares) {
        for (let i = 0; i < width * width; i++) {
            const square = document.createElement('div');
            square.dataset.id = i;
            grid.appendChild(square);
            squares.push(square);
        }
    }

    function startGameMulti() {
        if (isGameOver) return;
        infoDisplay.innerHTML = currentPlayer === 'user' ? 'Your Turn' : "Enemy's Turn";
        setupButtons.style.display = 'none';
    }

    function updatePlayerInfo(players) {
        const p1Name = document.querySelector('.p1 .player-name');
        const p2Name = document.querySelector('.p2 .player-name');
        if (players[0]) p1Name.textContent = players[0].username;
        if (players[1]) p2Name.textContent = players[1].username;
    }

    function handleEnemyFire(square, id) {
        if (!square.classList.contains('boom') && !square.classList.contains('miss')) {
            const hit = square.classList.contains('taken');
            square.classList.add(hit ? 'boom' : 'miss');
            if (hit) {
                socket.emit('fire-reply', { id, result: 'hit' });
            } else {
                socket.emit('fire-reply', { id, result: 'miss' });
            }
        }
        currentPlayer = 'user';
        turnDisplay.innerHTML = 'Your Turn';
    }

    function updateEnemyFire(data) {
        const enemySquare = computerGrid.querySelector(`div[data-id='${data.id}']`);
        enemySquare.classList.add(data.result === 'hit' ? 'boom' : 'miss');
        if (data.result === 'hit') {
            infoDisplay.innerHTML = 'You hit the enemy!';
        } else {
            infoDisplay.innerHTML = "You missed.";
        }
        currentPlayer = 'enemy';
        turnDisplay.innerHTML = "Enemy's Turn";
    }

    function resetGame() {
        isGameOver = false;
        ready = false;
        enemyReady = false;
        rocketCount = 3;
        rocketMode = false;
        infoDisplay.innerHTML = '';
        turnDisplay.innerHTML = '';
        userSquares.forEach((square) => (square.className = ''));
        computerSquares.forEach((square) => (square.className = ''));
        socket.emit('reset-game');
    }
});
