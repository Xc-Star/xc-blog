-- =====================================================================
--  XHBlogs 数据库结构
--  数据库是唯一数据源，博客端只读，管理端经由 FastAPI 写入。
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------
-- 站点配置：键值对存储，值统一为 JSON，便于按字段白名单增量更新
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_config (
  config_key   VARCHAR(64)  NOT NULL,
  config_value JSON         NOT NULL,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 文章与杂谈：同一张表，用 doc_type 区分
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug         VARCHAR(191)    NOT NULL,
  doc_type     ENUM('post','chatter') NOT NULL DEFAULT 'post',
  title        VARCHAR(255)    NOT NULL DEFAULT '',
  description  TEXT            NULL,
  cover        VARCHAR(1024)   NULL,
  mood         VARCHAR(64)     NULL,
  tags         JSON            NULL,
  content      MEDIUMTEXT      NULL,
  published_at DATETIME        NULL,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_documents_type_slug (doc_type, slug),
  KEY idx_documents_type_published (doc_type, published_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 说说
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS moments (
  id           VARCHAR(64)   NOT NULL,
  content      TEXT          NULL,
  location     VARCHAR(255)  NULL,
  images       JSON          NULL,
  published_at DATETIME      NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_moments_published (published_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 单页内容（关于我等）
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pages (
  slug       VARCHAR(64)   NOT NULL,
  title      VARCHAR(255)  NOT NULL DEFAULT '',
  cover      VARCHAR(1024) NULL,
  content    MEDIUMTEXT    NULL,
  updated_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 草稿箱
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drafts (
  id            VARCHAR(64)   NOT NULL,
  doc_type      VARCHAR(32)   NOT NULL DEFAULT 'post',
  title         VARCHAR(255)  NOT NULL DEFAULT '',
  description   TEXT          NULL,
  cover         VARCHAR(1024) NULL,
  mood          VARCHAR(64)   NULL,
  tags          JSON          NULL,
  content       MEDIUMTEXT    NULL,
  doc_date      VARCHAR(64)   NULL,
  last_modified BIGINT        NOT NULL DEFAULT 0,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_drafts_modified (last_modified DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 相册与照片
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS albums (
  id          VARCHAR(64)   NOT NULL,
  title       VARCHAR(255)  NOT NULL DEFAULT '',
  description TEXT          NULL,
  cover       VARCHAR(1024) NULL,
  album_date  VARCHAR(64)   NULL,
  photos      JSON          NULL,
  sort_order  INT           NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_albums_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 友链
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS friends (
  id          VARCHAR(64)   NOT NULL,
  name        VARCHAR(255)  NOT NULL DEFAULT '',
  url         VARCHAR(1024) NULL,
  description TEXT          NULL,
  avatar      VARCHAR(1024) NULL,
  theme_color VARCHAR(64)   NULL,
  sort_order  INT           NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_friends_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 项目矩阵
-- ---------------------------------------------------------------------
-- ---------------------------------------------------------------------
-- 项目分类（由管理端自由增删）
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_categories (
  id         VARCHAR(64) NOT NULL,
  name       VARCHAR(64) NOT NULL DEFAULT '',
  sort_order INT         NOT NULL DEFAULT 0,
  updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_project_categories_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id          VARCHAR(64)   NOT NULL,
  name        VARCHAR(255)  NOT NULL DEFAULT '',
  description TEXT          NULL,
  icon        VARCHAR(64)   NULL,
  category    VARCHAR(64)   NOT NULL DEFAULT '',
  github_url  VARCHAR(1024) NULL,
  tags        JSON          NULL,
  sort_order  INT           NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_projects_sort (sort_order),
  KEY idx_projects_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 管理端账号：密码为 PBKDF2-SHA256，格式 pbkdf2_sha256$<iterations>$<salt_b64>$<hash_b64>
-- 首次启动时后端会用 ADMIN_PASSWORD 环境变量自动创建 admin 账号
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(64)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  last_login_at DATETIME     NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_admin_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

