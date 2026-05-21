<template>
  <div class="tea-home">
    <section class="hero">
      <div class="hero-left">
        <img class="hero-logo" src="@/assets/logo/tea-logo.svg" alt="茶叶Logo" />
        <div>
          <h1>国茶经营管理系统</h1>
          <p>以茶为业，以数为据，构建采购、销售、调拨与库存的一体化经营中台。</p>
        </div>
      </div>
      <div class="hero-right">
        <div class="poem">茶和天下 · 静观万象</div>
      </div>
    </section>

    <section class="metrics">
      <article class="metric-card">
        <h3>核心茶类</h3>
        <p>绿茶 / 红茶 / 乌龙 / 白茶 / 普洱</p>
      </article>
      <article class="metric-card">
        <h3>业务闭环</h3>
        <p>采购入仓 → 销售出仓 → 加工调拨 → 库存分析</p>
      </article>
      <article class="metric-card">
        <h3>运营目标</h3>
        <p>品质可追溯 · 库存可视化 · 经营可决策</p>
      </article>
    </section>

    <section class="culture">
      <h2>茶文化首页</h2>
      <p>
        茶，起于山川，成于匠心。系统以茶企经营场景为核心，强调流程标准化、数据一致性与可追溯能力，
        让每一批茶品从采购、仓储到销售都有清晰的数据轨迹。
      </p>
    </section>
  </div>
</template>

<script setup name="TeaHome"></script>

<style lang="scss" scoped>
.tea-home {
  min-height: calc(100vh - 84px);
  padding: 20px;
  background: linear-gradient(160deg, #f6f2e8 0%, #eef5e9 100%);
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  background: #ffffff;
  border: 1px solid #dce8d6;
  border-radius: 16px;
  padding: 24px;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.hero-logo {
  width: 68px;
  height: 68px;
}

.hero-left h1 {
  margin: 0 0 8px;
  color: #2f6b2f;
  font-size: 28px;
}

.hero-left p {
  margin: 0;
  color: #5f6f5b;
}

.hero-right {
  display: flex;
  align-items: center;
}

.poem {
  padding: 10px 14px;
  border: 1px dashed #98b68f;
  border-radius: 10px;
  color: #3f5637;
  background: #f7fbf4;
}

.metrics {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  background: #ffffff;
  border: 1px solid #dce8d6;
  border-radius: 12px;
  padding: 18px;
}

.metric-card h3 {
  margin: 0 0 10px;
  color: #2f6b2f;
}

.metric-card p {
  margin: 0;
  color: #5f6f5b;
}

.culture {
  margin-top: 16px;
  background: #ffffff;
  border: 1px solid #dce8d6;
  border-radius: 12px;
  padding: 20px;
}

.culture h2 {
  margin: 0 0 12px;
  color: #2f6b2f;
}

.culture p {
  margin: 0;
  color: #4f5f4b;
  line-height: 1.8;
}
</style>
