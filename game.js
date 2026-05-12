/**
 * 打地鼠微信小游戏
 * 适合初学者的完整实现
 */

// 获取画布和上下文
const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

// 游戏配置
const CONFIG = {
  HOLE_ROWS: 3,        // 洞的行数
  HOLE_COLS: 3,        // 洞的列数
  GAME_TIME: 30,       // 游戏时长（秒）
  MOLE_STAY_TIME: 1500, // 地鼠停留时间（毫秒）
  SPAWN_INTERVAL: 800, // 生成地鼠间隔（毫秒）
  HIT_SCORE: 10,       // 打中得分
};

// 游戏状态
const STATE = {
  MENU: 0,    // 开始菜单
  PLAYING: 1, // 游戏中
  OVER: 2     // 游戏结束
};

// 地鼠类型
const MOLE_TYPES = {
  NORMAL: { color: '#8B4513', score: 10, speed: 1 },    // 普通地鼠 - 棕色
  GOLD: { color: '#FFD700', score: 30, speed: 0.8 },    // 金地鼠 - 金色，分高但出现时间短
  BLUE: { color: '#4169E1', score: 20, speed: 1.2 }     // 蓝地鼠 - 蓝色，分中等
};

// 洞类
class Hole {
  constructor(row, col, x, y, radius) {
    this.row = row;
    this.col = col;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.hasMole = false;
    this.mole = null;
  }

  // 绘制洞
  draw() {
    ctx.save();
    
    // 洞的阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 5, this.radius, this.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 洞的底部（深色）
    ctx.fillStyle = '#3d2817';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.radius, this.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 洞的边缘
    ctx.strokeStyle = '#5a3a1f';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.restore();
  }
}

// 地鼠类
class Mole {
  constructor(hole, type) {
    this.hole = hole;
    this.type = type;
    this.y = hole.y;           // 当前Y位置
    this.targetY = hole.y - 60; // 冒出目标位置
    this.startY = hole.y;       // 初始位置（在洞里）
    this.state = 'rising';      // rising（上升）, staying（停留）, hiding（躲藏）
    this.riseProgress = 0;      // 上升进度
    this.stayTimer = 0;         // 停留计时器
    this.isHit = false;         // 是否被打中
    this.hitTimer = 0;          // 被打中后的显示计时
  }

  update(dt) {
    if (this.isHit) {
      this.hitTimer -= dt;
      return this.hitTimer > 0;
    }

    switch (this.state) {
      case 'rising':
        // 上升动画
        this.riseProgress += dt * 0.003 * this.type.speed;
        if (this.riseProgress >= 1) {
          this.riseProgress = 1;
          this.state = 'staying';
          this.stayTimer = CONFIG.MOLE_STAY_TIME * this.type.speed;
        }
        this.y = this.startY + (this.targetY - this.startY) * this.easeOut(this.riseProgress);
        break;

      case 'staying':
        // 停留一段时间
        this.stayTimer -= dt;
        if (this.stayTimer <= 0) {
          this.state = 'hiding';
          this.riseProgress = 1;
        }
        break;

      case 'hiding':
        // 下降动画
        this.riseProgress -= dt * 0.004;
        if (this.riseProgress <= 0) {
          return false; // 地鼠完全躲起来了，可以移除
        }
        this.y = this.startY + (this.targetY - this.startY) * this.easeOut(this.riseProgress);
        break;
    }
    return true;
  }

  // 缓动函数，让动画更自然
  easeOut(t) {
    return 1 - (1 - t) * (1 - t);
  }

  // 绘制地鼠
  draw() {
    ctx.save();
    
    const x = this.hole.x;
    const y = this.y;
    const r = this.hole.radius * 0.7;

    // 如果被击中，显示星星效果
    if (this.isHit) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('+' + this.type.score, x, y - 20);
      
      // 星星
      this.drawStar(x, y - 50, 20, 5);
      ctx.restore();
      return;
    }

    // 身体
    ctx.fillStyle = this.type.color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // 身体阴影（立体感）
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.arc(x, y + r * 0.3, r * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛（白色底）
    const eyeOffset = r * 0.3;
    const eyeY = y - r * 0.2;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x - eyeOffset, eyeY, r * 0.25, 0, Math.PI * 2);
    ctx.arc(x + eyeOffset, eyeY, r * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // 眼珠（黑色）
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x - eyeOffset, eyeY, r * 0.12, 0, Math.PI * 2);
    ctx.arc(x + eyeOffset, eyeY, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // 鼻子
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.arc(x, y + r * 0.1, r * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // 嘴巴
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + r * 0.2, r * 0.25, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // 牙齿（如果有）
    ctx.fillStyle = 'white';
    ctx.fillRect(x - 5, y + r * 0.2, 4, 6);
    ctx.fillRect(x + 1, y + r * 0.2, 4, 6);

    ctx.restore();
  }

  // 绘制星星
  drawStar(x, y, radius, points) {
    ctx.save();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (Math.PI / points) * i - Math.PI / 2;
      const r = i % 2 === 0 ? radius : radius * 0.5;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 检查点击是否命中
  checkHit(touchX, touchY) {
    if (this.isHit) return false;
    const dx = touchX - this.hole.x;
    const dy = touchY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.hole.radius;
  }

  // 被打中
  hit() {
    this.isHit = true;
    this.hitTimer = 500; // 显示500毫秒
    return this.type.score;
  }
}

// 游戏主类
class Game {
  constructor() {
    this.state = STATE.MENU;
    this.score = 0;
    this.time = CONFIG.GAME_TIME;
    this.holes = [];
    this.moles = [];
    this.spawnTimer = 0;
    this.lastTime = 0;
    
    this.initHoles();
    this.bindEvents();
    this.loop();
  }

  // 初始化洞的位置
  initHoles() {
    const width = canvas.width;
    const height = canvas.height;
    
    // 计算洞的布局
    const marginX = width * 0.15;
    const marginY = height * 0.25;
    const gapX = (width - marginX * 2) / (CONFIG.HOLE_COLS - 1);
    const gapY = (height * 0.5) / (CONFIG.HOLE_ROWS - 1);
    const radius = Math.min(gapX, gapY) * 0.35;

    for (let row = 0; row < CONFIG.HOLE_ROWS; row++) {
      for (let col = 0; col < CONFIG.HOLE_COLS; col++) {
        const x = marginX + col * gapX;
        const y = marginY + row * gapY;
        this.holes.push(new Hole(row, col, x, y, radius));
      }
    }
  }

  // 绑定触摸事件
  bindEvents() {
    wx.onTouchStart((e) => {
      const touch = e.touches[0];
      this.handleTouch(touch.clientX, touch.clientY);
    });
  }

  // 处理触摸
  handleTouch(x, y) {
    switch (this.state) {
      case STATE.MENU:
        // 点击开始按钮区域开始游戏
        const cx = canvas.width / 2;
        const cy = canvas.height * 0.7;
        const bw = 200;
        const bh = 60;
        if (x > cx - bw/2 && x < cx + bw/2 && y > cy - bh/2 && y < cy + bh/2) {
          this.startGame();
        }
        break;

      case STATE.PLAYING:
        // 检查是否打中地鼠
        let hit = false;
        for (let i = this.moles.length - 1; i >= 0; i--) {
          const mole = this.moles[i];
          if (mole.checkHit(x, y)) {
            this.score += mole.hit();
            hit = true;
            
            // 震动反馈（需要开启震动权限）
            wx.vibrateShort({ type: 'light' }).catch(() => {});
            break;
          }
        }
        
        // 如果没打中，显示MISS（可选）
        if (!hit) {
          // 可以在这里添加MISS效果
        }
        break;

      case STATE.OVER:
        // 点击重新开始
        const ocx = canvas.width / 2;
        const ocy = canvas.height * 0.65;
        const obw = 200;
        const obh = 60;
        if (x > ocx - obw/2 && x < ocx + obw/2 && y > ocy - obh/2 && y < ocy + obh/2) {
          this.startGame();
        }
        break;
    }
  }

  // 开始游戏
  startGame() {
    this.state = STATE.PLAYING;
    this.score = 0;
    this.time = CONFIG.GAME_TIME;
    this.moles = [];
    this.spawnTimer = 0;
  }

  // 游戏结束
  gameOver() {
    this.state = STATE.OVER;
    this.moles = [];
  }

  // 生成地鼠
  spawnMole() {
    // 找出没有地鼠的洞
    const emptyHoles = this.holes.filter(h => !h.hasMole);
    if (emptyHoles.length === 0) return;

    // 随机选一个洞
    const hole = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];
    
    // 随机选择地鼠类型
    const rand = Math.random();
    let type;
    if (rand < 0.1) {
      type = MOLE_TYPES.GOLD;  // 10%概率金地鼠
    } else if (rand < 0.3) {
      type = MOLE_TYPES.BLUE;  // 20%概率蓝地鼠
    } else {
      type = MOLE_TYPES.NORMAL; // 70%概率普通地鼠
    }

    const mole = new Mole(hole, type);
    hole.hasMole = true;
    hole.mole = mole;
    this.moles.push(mole);
  }

  update(dt) {
    if (this.state !== STATE.PLAYING) return;

    // 倒计时
    this.time -= dt / 1000;
    if (this.time <= 0) {
      this.time = 0;
      this.gameOver();
      return;
    }

    // 生成地鼠
    this.spawnTimer += dt;
    if (this.spawnTimer >= CONFIG.SPAWN_INTERVAL) {
      this.spawnTimer = 0;
      this.spawnMole();
      // 随机减少间隔，增加难度
      if (this.time < CONFIG.GAME_TIME * 0.5) {
        this.spawnTimer = CONFIG.SPAWN_INTERVAL * 0.3; // 后半段时间生成更快
      }
    }

    // 更新地鼠
    for (let i = this.moles.length - 1; i >= 0; i--) {
      const mole = this.moles[i];
      const alive = mole.update(dt);
      if (!alive) {
        mole.hole.hasMole = false;
        mole.hole.mole = null;
        this.moles.splice(i, 1);
      }
    }
  }

  draw() {
    // 清空画布
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制草地纹理
    this.drawGrass();

    switch (this.state) {
      case STATE.MENU:
        this.drawMenu();
        break;
      case STATE.PLAYING:
        this.drawPlaying();
        break;
      case STATE.OVER:
        this.drawPlaying();
        this.drawGameOver();
        break;
    }
  }

  // 绘制草地装饰
  drawGrass() {
    ctx.save();
    ctx.fillStyle = '#7FDD7F';
    for (let i = 0; i < 20; i++) {
      const x = (i * 137.5) % canvas.width;
      const y = (i * 89.7) % canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 绘制开始菜单
  drawMenu() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // 标题
    ctx.save();
    ctx.fillStyle = '#8B4513';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🔨 打地鼠', cx, cy - 80);
    
    ctx.fillStyle = '#555';
    ctx.font = '24px Arial';
    ctx.fillText('点击地鼠得分！', cx, cy - 20);
    ctx.fillText('金色地鼠分数更高哦~', cx, cy + 20);

    // 开始按钮
    const bw = 200;
    const bh = 60;
    const bx = cx - bw / 2;
    const by = canvas.height * 0.7 - bh / 2;

    // 按钮阴影
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(bx + 3, by + 3, bw, bh);

    // 按钮背景
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(bx, by, bw, bh);

    // 按钮边框
    ctx.strokeStyle = '#FF4757';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, bw, bh);

    // 按钮文字
    ctx.fillStyle = 'white';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('开始游戏', cx, canvas.height * 0.7 + 10);
    
    ctx.restore();
  }

  // 绘制游戏进行中
  drawPlaying() {
    // 绘制所有洞
    for (const hole of this.holes) {
      hole.draw();
    }

    // 绘制所有地鼠
    for (const mole of this.moles) {
      mole.draw();
    }

    // 绘制UI
    this.drawUI();
  }

  // 绘制游戏UI
  drawUI() {
    ctx.save();
    
    // 分数背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(10, 10, 150, 45);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 150, 45);

    // 分数文字
    ctx.fillStyle = '#8B4513';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`分数: ${this.score}`, 20, 42);

    // 时间背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(canvas.width - 160, 10, 150, 45);
    ctx.strokeStyle = '#8B4513';
    ctx.strokeRect(canvas.width - 160, 10, 150, 45);

    // 时间文字
    ctx.fillStyle = this.time <= 5 ? '#FF0000' : '#8B4513';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`时间: ${Math.ceil(this.time)}s`, canvas.width - 20, 42);

    ctx.restore();
  }

  // 绘制游戏结束
  drawGameOver() {
    ctx.save();
    
    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // 游戏结束面板
    const pw = 300;
    const ph = 250;
    const px = cx - pw / 2;
    const py = cy - ph / 2 - 30;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, pw, ph);

    // 标题
    ctx.fillStyle = '#8B4513';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束！', cx, py + 50);

    // 最终分数
    ctx.fillStyle = '#FF6B6B';
    ctx.font = 'bold 48px Arial';
    ctx.fillText(`${this.score}`, cx, py + 110);
    
    ctx.fillStyle = '#666';
    ctx.font = '20px Arial';
    ctx.fillText('最终得分', cx, py + 140);

    // 评价
    let comment = '';
    if (this.score >= 200) comment = '地鼠杀手！🌟';
    else if (this.score >= 100) comment = '反应神速！👍';
    else if (this.score >= 50) comment = '还不错哦~';
    else comment = '再接再厉！';
    
    ctx.fillStyle = '#FF8C00';
    ctx.font = '22px Arial';
    ctx.fillText(comment, cx, py + 180);

    // 重新开始按钮
    const bw = 200;
    const bh = 50;
    const bx = cx - bw / 2;
    const by = canvas.height * 0.65 - bh / 2;

    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#26A69A';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('再玩一次', cx, canvas.height * 0.65 + 8);

    ctx.restore();
  }

  // 游戏主循环
  loop() {
    const now = Date.now();
    const dt = this.lastTime ? now - this.lastTime : 16;
    this.lastTime = now;

    this.update(dt);
    this.draw();

    requestAnimationFrame(() => this.loop());
  }
}

// 启动游戏
new Game();
