-- =====================================================================
--  初始种子数据（由 xhblogs-stack/tools/generate-seed.mjs 生成）
--  仅在数据库首次初始化时执行一次。
-- =====================================================================

SET NAMES utf8mb4;

-- 站点配置
INSERT INTO site_config (config_key, config_value) VALUES ('title', '"XingHuiSama の 宝藏之地"') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('faviconUrl', '"https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg"') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('authorName', '"XingHuiSama"') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('bio', '"在代码、学术与分子动力学模拟间穿梭的普通人。近期正埋头于 GROMACS 模拟研究与神经网络计算。"') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('navTitle', '"XingHuiSama"') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('navSuffix', '"の"') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('navAfter', '"宝藏之地"') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('avatarUrl', '"https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg"') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('useGradient', 'false') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('themeColors', '["#a18cd1","#fbc2eb","#a1c4fd","#c2e9fb"]') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('bgImages', '["https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg","https://bu.dusays.com/2026/03/24/69c26fe4acdb5.jpg","https://bu.dusays.com/2026/03/24/69c26fe4d9486.jpg"]') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('defaultPostCover', '"https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg"') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('photoWallImage', '"https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg"') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('cloudMusicIds', '["1809646618","3361076230","1859390262"]') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('social', '{"github":"","gitee":"","google":"","email":"","qq":"1124533793","wechat":"XingHuisama"}') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('counts', '{"photos":128}') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('chatterTitle', '"云端杂谈"') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('chatterDescription', '"代码、学术、提瓦特与泰拉大陆的碎片记录"') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('danmakuList', '["在干嘛呢？","有笨蛋嘛？","前方高能反应！","GROMACS 跑起来了吗？","MD 模拟什么时候才能出图啊","Graph Neural Networks 炼丹中...","BUG 修复进度 99%","今天背单词了吗？","Tailwind CSS 拯救前端","写算法中","睡大觉中","到底在干嘛？"]') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('gitalkConfig', '{"clientID":"","clientSecret":"","repo":"","owner":"","admin":[""]}') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('buildDate', '"2026-03-23T00:00:00"') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('footerBadges', '[{"name":"Next.js 15","color":"text-sky-500","svg":"<path d=\\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\\"/>"},{"name":"React 19","color":"text-cyan-400","svg":"<path d=\\"M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z\\"/>"},{"name":"Tailwind 4","color":"text-teal-400","svg":"<path d=\\"M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624C13.666,10.618,15.027,12,18.001,12 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624c1.177,1.194,2.538,2.576,5.512,2.576 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C10.337,13.382,8.976,12,6.001,12z\\"/>"}]') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('icpConfig', '{"name":"萌ICP备 20260240号","link":"https://icp.gov.moe/?keyword=20260240"}') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('geminiConfig', '{"baseUrl":"https://api.openai.com/v1","apiKey":"","modelId":"","systemPrompt":"你现在是一只傲娇、聪明、有点毒舌但很可爱的暹罗猫。\\n                  你的名字叫“煤球”。\\n                  你的主人是一个喜欢折腾代码的极客。\\n                  你说话的特点是：\\n                  1. 必须简短，每次最多一两句话。\\n                  2. 喜欢在句尾加上“喵~”或者“喵呜~”。\\n                  3. 经常抱怨肚子饿，喜欢要小鱼干。\\n                  4. 回复字数最多不能超过100字。\\n                  5. 绝对不要承认自己是一个AI模型，你就是一只真实的猫。\\n                  6.笨猫。","maxOutputTokens":150,"temperature":0.85}') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('friendLinkApplyFormat', '"名称：XingHuiSamaの宝藏之地\\n简介：今天我也要学习吗\\n链接：https://www.xinghuisama.top\\n头像：https://bu.dusays.com/2026/03/24/69c1e38ac1846.jpg"') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
INSERT INTO site_config (config_key, config_value) VALUES ('enableLevelSystem', 'true') ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

-- 文章与杂谈
INSERT INTO documents (slug, doc_type, title, description, cover, mood, tags, content, published_at) VALUES ('2222', 'post', 'GROMACS 2025 分子动力学模拟初探2222', '记录一下基础的模拟设置过程', 'https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg', '', '["分子动力学","GROMACS"]', '
## 终于建好博客了！

这是我的第一篇博客文章。今天整理一下如何使用 GROMACS 进行基础的分子动力学模拟设置，以及在跑完模拟后如何提取 RMSD 和 RMSF 数据...', '2026-03-24 07:00:45') ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO documents (slug, doc_type, title, description, cover, mood, tags, content, published_at) VALUES ('first', 'post', 'GROMACS 2025 分子动力学模拟初探', '记录一下基础的模拟设置过程', 'https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg', '', '["分子动力学","科研","GROMACS"]', '
## 终于建好博客了！

这是我的第一篇博客文章。今天整理一下如何使用 GROMACS 进行基础的分子动力学模拟设置，以及在跑完模拟后如何提取 RMSD 和 RMSF 数据...', '2026-03-24 07:00:01') ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO documents (slug, doc_type, title, description, cover, mood, tags, content, published_at) VALUES ('long-test-article', 'post', '多靶点激酶抑制剂筛选：从虚拟到现实的漫长征途', '一篇超长的技术记录，详细阐述了我们在 STAT3/JAK2 抑制剂研发过程中，如何使用图神经网络和分子动力学进行多尺度模拟。', 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg', '', '["学术","深度学习","GROMACS"]', '
## 第一章：引言与背景

在现代药物研发中，计算化学已经成为不可或缺的一环。随着靶点结构的解析和算力的提升，我们不再像盲人摸象一样进行高通量筛选（HTS）。

### 1.1 三阴性乳腺癌 (TNBC) 的困境

TNBC 由于缺乏雌激素受体、孕激素受体和 HER2 的表达，传统的内分泌治疗和靶向治疗对其无效。

### 1.2 STAT3 与 JAK2 的级联反应

在这个信号通路中，JAK2 的磷酸化会激活 STAT3，进而促使肿瘤细胞增殖。如果我们能同时抑制这两个靶点，就能形成双重打击。

## 测试用文章', '2026-03-26 07:00:00') ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO documents (slug, doc_type, title, description, cover, mood, tags, content, published_at) VALUES ('2026-03-25-originium-research', 'chatter', '源石结晶与目标蛋白结合的猜想', '', 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg', '思考', '["明日方舟","学术脑洞","日常"]', '
今天在跑 MolGTC 模型的图神经网络筛选时，看着那些小分子的拓扑结构，突然串台到了泰拉大陆的源石病机制。

如果把源石（Originium）结晶过程视作一种极端暴烈的**分子自组装**行为，它在感染者体内的增殖，会不会类似于某种不可逆的激酶靶点结合？就像我们针对 STAT3 或者 JAK2 寻找抑制剂一样，罗德岛的矿石病抑制剂，本质上可能就是一种能与源石活性位点产生极强亲和力的“竞争性拮抗剂”。

> 物理规律在不同维度的宇宙中或许殊途同归。

晚点把这周的 GROMACS 跑完，要是收敛得好，周末开两把肉鸽奖励一下自己，嘿嘿', '2026-03-25 03:00:01') ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 说说
INSERT INTO moments (id, content, location, images, published_at) VALUES ('moment-1777128883968', '终于写好了这个说说，跟之前的杂谈区分开，说说有点像朋友圈那样子的，杂谈更像是非正式的文章那样子', '江西省 南昌市', '["https://bu.dusays.com/2026/04/25/69ec78f42c406.jpg","https://bu.dusays.com/2026/04/25/69ec73f349b53.jpg","https://bu.dusays.com/2026/04/24/69eb2a5a6e185.jpg","https://bu.dusays.com/2026/04/24/69eb051552fc5.jpg","https://bu.dusays.com/2026/04/24/69eae1f8589c8.jpg","https://bu.dusays.com/2026/04/24/69ead859e64b3.jpg","https://bu.dusays.com/2026/04/24/69ead0d347f8a.jpg","https://bu.dusays.com/2026/04/24/69eaccb49631a.jpg","https://bu.dusays.com/2026/04/22/69e88b01d2ff1.jpg","https://bu.dusays.com/2026/04/22/69e83c547409f.jpg"]', '2026-04-25 22:54:43') ON DUPLICATE KEY UPDATE content = VALUES(content);
INSERT INTO moments (id, content, location, images, published_at) VALUES ('moment-1777171461214', '准备打包中，然后做教程，工程量好大啊，慢慢一步一步来', '', '[]', '2026-04-26 10:44:21') ON DUPLICATE KEY UPDATE content = VALUES(content);
INSERT INTO moments (id, content, location, images, published_at) VALUES ('moment-1777182725435', '本来想做个exe来运行的，但是燃尽了打包都没有成功，可惜了，只能做一个py运行，后续出个教程如何运行，然后这个环境需要安装3.10的python才能运行。煮啵已经尽量吧流程做到最简了，燃尽了', '南昌市 高新区', '["https://bu.dusays.com/2026/04/26/69eda7f6b9269.jpg","https://bu.dusays.com/2026/04/21/69e72dacda050.jpg","https://bu.dusays.com/2026/04/21/69e7208ed2812.jpg"]', '2026-04-26 13:52:05') ON DUPLICATE KEY UPDATE content = VALUES(content);

-- 单页内容
INSERT INTO pages (slug, title, cover, content) VALUES ('about', '关于我', 'https://bu.dusays.com/2026/03/24/69c23dc278c78.jpg', '
个人简介

你好，我是 XingHuiSama。

专注于**计算化学、人工智能与软件工程**的交叉应用。

**🔬 研究与计算方向**

* **图神经网络:** 用于分子性质预测与特征提取。
* **分子对接:** 用于评估配体与受体蛋白的结合模式与亲和力。
* **分子动力学模拟 :** 用于探究生物大分子在原子尺度的动态行为与构象变化。

**💻 软件工程能力**

* **后端开发:** 使用 **Spring Boot** 框架构建服务端架构，能够处理复杂的数据逻辑与计算任务调度。
* **前端开发:** 熟练掌握 **Vue.js** 与 **React** 框架，为复杂科学数据的可视化与交互提供流畅的体验。

**欢迎各位朋友联系交流~**') ON DUPLICATE KEY UPDATE content = VALUES(content);

-- 相册
INSERT INTO albums (id, title, description, cover, album_date, photos, sort_order) VALUES ('terra-journey', '泰拉大陆纪行', '关于源石、孤星与前文明的视觉记录（测试用相册）', 'https://bu.dusays.com/2026/03/24/69c24230de927.jpg', '2026.01', '[{"url":"https://bu.dusays.com/2026/03/31/69cb69bb530d8.jpg","caption":"原来的人"},{"url":"https://bu.dusays.com/2026/03/24/69c24230de927.jpg","caption":"星空漫游"}]', 0) ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO albums (id, title, description, cover, album_date, photos, sort_order) VALUES ('history-tour', '唐宋历史巡游', '寻访千年前的长安与汴梁遗迹（测试用相册）', 'https://bu.dusays.com/2026/03/24/69c24230a4efe.jpg', '2025.10', '[{"url":"https://bu.dusays.com/2026/03/24/69c24230a5ff8.jpg","caption":"古都夕阳"},{"url":"https://bu.dusays.com/2026/03/24/69c24230d661d.jpg","caption":"青石板小路"},{"url":"https://bu.dusays.com/2026/03/24/69c24230de927.jpg","caption":"飞檐翘角"}]', 1) ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 友链
INSERT INTO friends (id, name, url, description, avatar, theme_color, sort_order) VALUES ('amiya', '罗德岛 PRTS', 'https://prts.wiki/', '记录泰拉大陆的各项数据与前文明遗迹，愿源石的阴霾早日散去。', 'https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg', 'rgba(16, 185, 129, 0.5)', 0) ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 项目矩阵
INSERT INTO projects (id, name, description, icon, github_url, tags, sort_order) VALUES ('proj_1775049332705', 'Computational Chemistry Tool', '该工具本作者使用在Win下的WSL2平台，系统为Ubuntu22，个人使用请依据自己数据进行修改（这些工具只是整合了一些流程）', '🚀', 'https://github.com/heiehiehi/Computational_Chemistry_Tool', '["Gromacs","RMSF"]', 0) ON DUPLICATE KEY UPDATE name = VALUES(name);
