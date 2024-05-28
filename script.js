    "use strict";
    const canvas = document.getElementById("tetris");
    const context = canvas.getContext("2d");
    let dropInterval = level(); 
    const nextTetrisCanvas = document.getElementById("next-tet");
    const nextTetrisContext = nextTetrisCanvas.getContext("2d");

    let isGameRunning = false;

    document.addEventListener("DOMContentLoaded", function() {
        
        var message = "Bienvenu! 👋\n" +
              "Les consignes sont simples:\n" +
              "⬅️ Déplacement à gauche\n" +
              "➡️ Déplacement à droite\n" +
              "⬆️Rotation 90° du tétrimino\n" +
              "\"Espace\" Accélération de la chute\n" +
              "⚠️ Plus le niveau augmente plus la vitesse de chute augmente!\n" +
              "⚠️ Vous pouvez également choisir le niveau de difficulté souhaité!\n" +
              "🔄 A partir du 2eme niveau vous pouvez changer le prochain tetrimino!\n" +
              "Bonne chance! 🍀";

alert(message);

        
    });

    context.scale(20, 20);
    
   // vitesse de chute du tétrimino selon le niveau de diff
    function level() {
        const selectedValue = document.getElementById('level').value;

        if (selectedValue === 'difficile') {
            return 250;
        } else if (selectedValue === 'normal') {
            return 400;
        } else if (selectedValue === 'facile') {
            return 500;
        } else {
            return 0;
        }
        
    }

    //création de la matrice (remplissage avec 0)
    function createMatrix(w, h) {
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        return matrix;
    }

    // création des formes du Tetrimino
    function createPiece(type) {
        if (type === "I") {
            return [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
            ];
        } else if (type === "L") {
            return [
                [0, 2, 0],
                [0, 2, 0],
                [0, 2, 2],
            ];
        } else if (type === "J") {
            return [
                [0, 3, 0],
                [0, 3, 0],
                [3, 3, 0],
            ];
        } else if (type === "O") {
            return [
                [4, 4],
                [4, 4],
            ];
        } else if (type === "Z") {
            return [
                [5, 5, 0],
                [0, 5, 5],
                [0, 0, 0],
            ];
        } else if (type === "S") {
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ];
        } else if (type === "T") {
            return [
                [0, 7, 0],
                [7, 7, 7],
                [0, 0, 0],
            ];
        }
    }

    // Tetrimino
    function drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const color = colors[value];
                    context.fillStyle = color;
                    context.fillRect(x + offset.x, y + offset.y, 1, 1);
                    context.lineJoin = "round"
                    //bordure
                    context.strokeStyle = 'black'; 
                    context.lineWidth = 0.1; 
                    context.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
            });
        });
    }

    //Déssiner le prochain tetrimino
    function drawNextTetriminoMatrix(matrix, offset) {
        const blockSize = 10; 
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const color = colors[value];
                    nextTetrisContext.fillStyle = color;
                   
                    const rectWidth = blockSize;
                    const rectHeight = blockSize;

                    nextTetrisContext.fillRect(
                        (x + offset.x) * blockSize,  
                        (y + offset.y) * blockSize,  
                        rectWidth,
                        rectHeight
                    );
                    nextTetrisContext.lineJoin = "round";
                    // Bordure
                    nextTetrisContext.strokeStyle = 'black';
                    nextTetrisContext.lineWidth = 0.1;
                    nextTetrisContext.strokeRect(
                        (x + offset.x) * blockSize,
                        (y + offset.y) * blockSize,
                        rectWidth,
                        rectHeight
                    );
                }
            });
        });
    }



    //fusionner le tetrimino avec le reste
    function merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;   //coller le tétrimino dans l'aire de jeu à sa nouvelle position
                }
            });
        });
    }

    //faire une rotation du tetrimino
    //si dir > 0, chaque ligne de la matrice est inversée horizontalement.
    //Si dir < 0, la matrice entière est inversée verticalement.
    function rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        if (dir > 0) {
            matrix.forEach((row) => row.reverse());
        } else {
            matrix.reverse();
        }
    }
  
    //verifier si il y a une collision true ou false en comparant les positions des éléments non vides du tétrimino avec les positions correspondantes dans l'aire de jeu.
    function collide(arena, player) {
        const m = player.matrix;
        const o = player.pos;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    //couleur du tetrimino
    const colors = [
        null,
        "#ff0d72",
        "#0dc2ff",
        "#0dff72",
        "#f538ff",
        "#ff8e0d",
        "#ffe138",
        "#3877ff",
    ];

    const arena = createMatrix(12, 20);

    //initialisation du joueur
    const player = {
        pos: { x: 0, y: 0 },
        matrix: null,
        score: 0,
        niveau:1,
    };

    let dropCounter = 0;

    let lastTime = 0;

    let isPaused = false;
    let animationId; 
    
    //modification du prochain tetrimino
    function updateNextTetrimino() {
        if(player.niveau>=2){
        const pieces = "TJLOSZI";
        nextTetrimino = createPiece(pieces[(pieces.length * Math.random()) | 0]);
        drawNextTetrimino();
    }
    }


    



    // commencer le jeu
    function startGame() {
            // Initialisations
            if (!isGameRunning) {
               // si jeu n'est pas en cours
            playerReset();
            updateScore();
            update(); // lancer le jeu
            pauseButton.disabled = false
            startButton.innerText = "Recommencer";
            isGameRunning = true;
            }

            playerReset();
            updateScore();
            context.clearRect(0, 0, canvas.width, canvas.height); //effacer le canvas pour un nouveau jeu 
            arena.forEach((row) => row.fill(0));
            dropInterval = level();
            
            
    }


    const startButton = document.getElementById("startButton");
    startButton.addEventListener("click", startGame);


    //Mettre en pause
    function pauseGame() {
        isPaused = !isPaused; 
        if (isPaused) {
            cancelAnimationFrame(animationId);  // figer le jeu
            pauseButton.innerText = "Continuer";
        } else {
            update(); // relancer le jeu
            pauseButton.innerText = "Pause";
        }
    }

    const pauseButton = document.getElementById("pauseButton");
    pauseButton.addEventListener("click", pauseGame);

    const stopButton = document.getElementById("stopButton");
    stopButton.addEventListener("click",stopGame);


    //Stopper le jeu
    function stopGame(){
        context.clearRect(0, 0, canvas.width, canvas.height); //efface le canvas.

        // vider le champ du jeu 
        arena.forEach((row) => row.fill(0));

        // Reinitialisations
        playerReset();
        player.score = 0;
        player.niveau=1;
        updateScore();

        //désactiver btn pause
        pauseButton.disabled = true;
        
      //activer btn commencer
        isGameRunning = false; // Set the game as not running
        startButton.innerHTML = "Commencer"
        pauseButton.innerHTML = "Pause"
        pauseButton.disabled = true
        isPaused = false
        cancelAnimationFrame(animationId); //figer le jeu.
    }

    let nextTetrimino;

    //dessiner le prochain en ecrasant celui qui vient de s'afficher
    function drawNextTetrimino() {
        nextTetrisContext.clearRect(0, 0, nextTetrisCanvas.width, nextTetrisCanvas.height);
        if (nextTetrimino) {  // vérifie si le prochain tétrimino existe
            drawMatrix(nextTetrimino, { x: 0, y:4 }, nextTetrisContext);
        }
    }


    // réinitialiser le joueur à chaque nouvelle pièce ou lorsqu'une partie commence

    function playerReset() {
        const pieces = "TJLOSZI";
        player.matrix = nextTetrimino || createPiece(pieces[(pieces.length * Math.random()) | 0]); //Génère une nouvelle matrice de tétrimino 
        nextTetrimino = createPiece(pieces[(pieces.length * Math.random()) | 0]); //Génère next tetrimino
        player.pos.y = 0; //tetrimino au sommet du jeu.
        player.pos.x = ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0); //Centre le tetrimino au milieu du jeu
        if (collide(arena, player)) {
            arena.forEach((row) => row.fill(0));
            player.score = 0;
            player.niveau = 1;
            updateScore();
        }//Si une collision est détectée alors partie terminée
        drawNextTetrimino(); // Afficher le prochain tétrimino à chaque réinitialisation du joueur
    }


    drawNextTetrimino();

    // mise à jour du score
    function updateScore() {
        document.getElementById("score").innerText = "Score : " + player.score;
        document.getElementById("niveau").innerText = "Niveau : " + player.niveau;

    }

    // les commandes du jeu

    document.addEventListener("keydown", (event) => {
        if (event.keyCode === 37) {
            playerMove(-1);
        } else if (event.keyCode === 39) {
            playerMove(1);
        } else if (event.keyCode === 32) { 
            event.preventDefault(); 
            playerDrop();
        } else if (event.keyCode === 38) {
            event.preventDefault(); 
            playerRotate(-1);

            
        } 
    });

    // commencer la boucle du jeu
    function update(time = 0) {
        if (!isPaused) {
            const deltaTime = time - lastTime;
            dropCounter += deltaTime;
            if (dropCounter > dropInterval) {
                playerDrop();
            }
            lastTime = time;
            draw();
        }

        animationId = requestAnimationFrame(update);  //planifier le prochain appel à la fonction update
    }

    // déplacement horizontal dte si offset >0 sinon gauche
    function playerMove(offset) {
        player.pos.x += offset;
        if (collide(arena, player)) {
            player.pos.x -= offset;
        }
    }

    // faire descendre le tetrimino 
    function playerDrop() {
        
        player.pos.y++;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
            if (player.pos.y <= 1) {
                //game over
                gameOver();
                return;
                
            }
            // un nouveau tétrimino 
            playerReset();
            //vérification et suppression des lignes complètes
            arenaSweep();
            updateScore();
        }
        dropCounter = 0;
    }



    function gameOver() {
        stopGame() // Stopper le jeu
        alert('Vous avez perdu 🥲! Nous vous souhaitons bonne chance pour la prochaine fois!');
        location.reload(); //recharger la page
        setTimeout(function() {
        location.reload();
        }, 1000) 
    
    }

    // faire une rotation du tetrimino
    function playerRotate(dir) {
        const pos = player.pos.x; //position actuelle du tetrimino  
        let offset = 1;
        rotate(player.matrix, dir);
        while (collide(arena, player)) { //si collision aprés rotation
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {  //si l'offset dépasse la taille du tétrimino
                rotate(player.matrix, -dir);
                player.pos.x = pos;
                return;
            }
        }
    }

    // suppression des lignes complètes
    function arenaSweep() {
        let rowCount = 0;
        for (let y = arena.length - 1; y >= 0; --y) {
            if (arena[y].every((value) => value !== 0)) { //si tous les éléments de la ligne sont diff de 0
               //supprimer la ligne
                arena.splice(y, 1);
                arena.unshift(new Array(arena[0].length).fill(0)); 
                ++rowCount;
                ++y; //remplacer la ligne complète par une ligne vide en haut 
            }
        }

        // Mise à jour du score selon le nombre de lignes
        if (rowCount === 1) {
            player.score += 40;
        } else if (rowCount === 2) {
            player.score += 100;
        } else if (rowCount === 3) {
            player.score += 300;
        } else if (rowCount === 4) {
            player.score += 1200;
        }
        if (player.score >= 1200) {
            player.niveau = 6;
            dropInterval -= 100;
        } else if (player.score >= 200) {
            player.niveau = 5;
            dropInterval -= 60;
        } else if (player.score >= 140) {
            player.niveau = 4;
            dropInterval -= 40;
        
        } else if (player.score >= 180) {
            player.niveau = 3;
            dropInterval -=20;

        } else if (player.score >= 140) {
            player.niveau = 2;
        
        }
        
        updateScore();
    }

    //tapis du jeu tétrimino actuel + prochain tetrimino
    function draw() {
        context.fillStyle = "#F5F5F5";
        context.fillRect(0, 0, canvas.width, canvas.height);
        drawMatrix(arena, { x: 0, y: 0 });
        drawMatrix(player.matrix, player.pos);

        if (nextTetrisContext) {
            const nextTetriminoOffset = { x: 5, y: 5 }; 
            drawNextTetriminoMatrix(nextTetrimino, nextTetriminoOffset);
        }
    }

