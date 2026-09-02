/**
 * 数据服务平台 · 共享侧边栏菜单
 * --------------------------------------------------
 * 用法:在需要菜单的页面放置
 *   <aside class="sidebar" id="sidebar-mount" data-current="页标识" aria-label="主导航"></aside>
 * 并在页面末尾引入 <script src="menu.js"></script>
 *
 * 调整菜单结构、文案、图标、跳转只需修改本文件 MENU 数组,所有页面同步生效。
 * data-current 取 MENU 中各叶子节点/一级项的 key。
 */
(function () {
  'use strict';

  var STYLE = '' +
    '.sidebar { width: var(--ds-sidebar-width); background: var(--ds-color-white); border-right: 1px solid var(--ds-border-2); padding: var(--ds-space-7) 0; flex-shrink: 0; }' +
    '.nav-title { font-size: var(--ds-font-size-12); color: var(--ds-text-3); padding: 0 var(--ds-space-7) var(--ds-space-4); letter-spacing: 0.4px; }' +
    '.nav-item { display: flex; align-items: center; gap: var(--ds-space-6); padding: 0 var(--ds-space-7); height: 40px; color: var(--ds-text-2); border-radius: var(--ds-radius-small); cursor: pointer; font-size: var(--ds-font-size-14); text-decoration: none; position: relative; }' +
    '.nav-item:hover { background: var(--ds-bg-fill); color: var(--ds-text-1); }' +
    '.nav-item[aria-current="page"] { background: var(--ds-color-primary-1); color: var(--ds-color-primary-6); font-weight: var(--ds-font-weight-medium); }' +
    '.nav-item[aria-current="page"]::before { content: ""; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; background: var(--ds-color-primary-6); border-radius: 0 2px 2px 0; }' +
    '.nav-item svg { flex-shrink: 0; }' +
    '.nav-section { margin-top: var(--ds-space-2); }' +
    '.nav-parent { display: flex; align-items: center; gap: var(--ds-space-6); padding: 0 var(--ds-space-7); height: 40px; color: var(--ds-text-2); border-radius: var(--ds-radius-small); cursor: pointer; font-size: var(--ds-font-size-14); user-select: none; text-decoration: none; position: relative; }' +
    '.nav-parent:hover { background: var(--ds-bg-fill); color: var(--ds-text-1); }' +
    '.nav-parent .chev { margin-left: auto; transition: transform var(--ds-duration-fast) var(--ds-ease-standard); }' +
    '.nav-parent.is-open .chev { transform: rotate(90deg); }' +
    '.nav-children { display: none; padding: var(--ds-space-2) 0 var(--ds-space-3); }' +
    '.nav-children.is-open { display: block; }' +
    '.nav-child { display: flex; align-items: center; gap: var(--ds-space-6); padding: 0 var(--ds-space-7) 0 42px; height: 36px; color: var(--ds-text-2); border-radius: var(--ds-radius-small); cursor: pointer; font-size: var(--ds-font-size-14); text-decoration: none; position: relative; }' +
    '.nav-child:hover { background: var(--ds-bg-fill); color: var(--ds-text-1); }' +
    '.nav-child[aria-current="page"] { background: var(--ds-color-primary-1); color: var(--ds-color-primary-6); font-weight: var(--ds-font-weight-medium); }' +
    '.nav-child[aria-current="page"]::before { content: ""; position: absolute; left: 32px; top: 8px; bottom: 8px; width: 3px; background: var(--ds-color-primary-6); border-radius: 0 2px 2px 0; }';

  // 图标 (内联 SVG,品牌中立)
  var ICON = {
    datasource: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><ellipse cx="9" cy="4" rx="6" ry="2" stroke="currentColor" stroke-width="1.4"/><path d="M3 4v5c0 1.1 2.7 2 6 2s6-.9 6-2V4" stroke="currentColor" stroke-width="1.4"/><path d="M3 9v5c0 1.1 2.7 2 6 2s6-.9 6-2V9" stroke="currentColor" stroke-width="1.4"/></svg>',
    api: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2.5" y="3" width="13" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 7h6M6 10h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="13" cy="10" r="1" fill="currentColor"/></svg>',
    market: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 6h12l-1 8a1 1 0 01-1 1H5a1 1 0 01-1-1L3 6z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M6 6V4a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    app: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><rect x="2.5" y="2.5" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="10.5" y="2.5" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="2.5" y="10.5" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="10.5" y="10.5" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/></svg>'
  };
  var CHEV = '<svg class="chev" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M4 3l4 3-4 3" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /**
   * 菜单结构 —— 后期调整只改这里
   * type: group(分组标题) / parent(可展开一级 + children) / item(叶子一级)
   */
  var MENU = [
    { type: 'group', label: '数据服务' },
    {
      type: 'parent', key: 'ds', label: '数据源', icon: ICON.datasource,
      children: [
        { key: 'datasource', label: '数据源', href: 'prototype-datasource.html' },
        { key: 'physical', label: '物理表', href: 'prototype-physical-table.html' },
        { key: 'logical', label: '逻辑表', href: 'prototype-logical-table.html' }
      ]
    },
    {
      type: 'parent', key: 'api', label: 'API', icon: ICON.api,
      children: [
        { key: 'api-dev', label: 'API 开发', href: 'prototype-api-list.html' },
        { key: 'api-orch', label: 'API 编排', href: 'prototype-api-orchestration.html' }
      ]
    },
    { type: 'item', key: 'market', label: '数据集市', href: 'prototype-market.html', icon: ICON.market },
    { type: 'item', key: 'data-app', label: '数据应用', href: 'prototype-data-app-list.html', icon: ICON.app }
  ];

  function findCurrentParent(current) {
    for (var i = 0; i < MENU.length; i++) {
      var m = MENU[i];
      if (m.type === 'parent' && m.children) {
        for (var j = 0; j < m.children.length; j++) {
          if (m.children[j].key === current) return m.key;
        }
      }
    }
    return null;
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function render() {
    var mount = document.getElementById('sidebar-mount');
    if (!mount) return;
    var current = mount.getAttribute('data-current') || '';
    var openParent = findCurrentParent(current);
    var hideAttr = mount.getAttribute('data-hide') || '';
    var hideSet = {};
    hideAttr.split(',').forEach(function (k) { var kk = k.trim(); if (kk) hideSet[kk] = true; });

    var html = '';
    MENU.forEach(function (m) {
      if (m.key && hideSet[m.key]) return;
      if (m.type === 'group') {
        html += '<div class="nav-title">' + esc(m.label) + '</div>';
      } else if (m.type === 'parent') {
        var isOpen = (m.key === openParent);
        html += '<div class="nav-section">';
        html += '<a class="nav-parent' + (isOpen ? ' is-open' : '') + '" href="#" role="button" data-parent="' + m.key + '" aria-expanded="' + (isOpen ? 'true' : 'false') + '">';
        html += m.icon || '';
        html += '<span>' + esc(m.label) + '</span>';
        html += CHEV;
        html += '</a>';
        html += '<div class="nav-children' + (isOpen ? ' is-open' : '') + '" data-children="' + m.key + '">';
        m.children.forEach(function (c) {
          var cur = (c.key === current) ? ' aria-current="page"' : '';
          html += '<a class="nav-child" href="' + c.href + '"' + cur + ' data-key="' + c.key + '">' + esc(c.label) + '</a>';
        });
        html += '</div></div>';
      } else if (m.type === 'item') {
        var cur2 = (m.key === current) ? ' aria-current="page"' : '';
        html += '<a class="nav-item" href="' + m.href + '"' + cur2 + ' role="button" data-key="' + m.key + '">';
        html += m.icon || '';
        html += '<span>' + esc(m.label) + '</span>';
        html += '</a>';
      }
    });
    mount.innerHTML = html;
    bind();
  }

  function bind() {
    // 一级父菜单:展开/收起
    document.querySelectorAll('.nav-parent[data-parent]').forEach(function (parent) {
      parent.addEventListener('click', function (e) {
        e.preventDefault();
        var open = parent.classList.toggle('is-open');
        parent.setAttribute('aria-expanded', open ? 'true' : 'false');
        var next = parent.nextElementSibling;
        if (next && next.classList.contains('nav-children')) {
          next.classList.toggle('is-open', open);
        }
      });
    });
    // 当前页:阻止默认跳转
    document.querySelectorAll('.nav-item[aria-current="page"], .nav-child[aria-current="page"]').forEach(function (node) {
      node.addEventListener('click', function (e) { e.preventDefault(); });
    });
  }

  function init() {
    var style = document.createElement('style');
    style.id = 'ds-menu-style';
    style.textContent = STYLE;
    document.head.appendChild(style);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
