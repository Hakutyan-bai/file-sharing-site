document.addEventListener('DOMContentLoaded', () => {
  // 添加文件按钮
  const addFileBtn = document.getElementById('addFileBtn');
  const fileForm = document.getElementById('fileForm');
  const cancelForm = document.getElementById('cancelForm');
  const fileFormContent = document.getElementById('fileFormContent');
  
  if (addFileBtn) {
    addFileBtn.addEventListener('click', () => {
      fileForm.style.display = 'flex';
      // 重置表单
      fileFormContent.reset();
      // 设置表单为添加模式
      fileFormContent.dataset.mode = 'add';
      fileFormContent.querySelector('h3').textContent = '添加新文件';
    });
  }
  
  if (cancelForm) {
    cancelForm.addEventListener('click', () => {
      fileForm.style.display = 'none';
    });
  }
  
  // 编辑按钮
  const editButtons = document.querySelectorAll('.edit-btn');
  editButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const fileId = btn.dataset.id;
      const fileCard = btn.closest('.file-card');
      const fileName = fileCard.querySelector('h3').textContent;
      
      // 获取所有链接
      const links = Array.from(fileCard.querySelectorAll('.links a'))
        .map(a => {
          const label = a.textContent.trim();
          const url = a.href;
          return `${label}|${url}`;
        })
        .join('\n');
      
      // 填充表单
      document.getElementById('fileName').value = fileName;
      document.getElementById('fileLinks').value = links;
      
      const iconImg = fileCard.querySelector('.file-icon img');
      const iconFA = fileCard.querySelector('.file-icon i');
      let icon = '';
      if (iconImg) {
        icon = iconImg.getAttribute('src');
      } else if (iconFA) {
        // 获取 class 中以 fa- 开头且不是 fa-solid 的那一项
        icon = Array.from(iconFA.classList).find(cls => cls.startsWith('fa-') && cls !== 'fa-solid') || '';
      }
      document.getElementById('fileIcon').value = icon;
      
      // 设置表单为编辑模式
      fileFormContent.dataset.mode = 'edit';
      fileFormContent.dataset.id = fileId;
      fileFormContent.querySelector('h3').textContent = '编辑文件';
      
      fileForm.style.display = 'flex';
    });
  });
  
  // 表单提交
  if (fileFormContent) {
    fileFormContent.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(fileFormContent);
      const name = formData.get('name');
      const links = formData.get('links');
      const icon = formData.get('icon');
      
      if (!name || !links) {
        alert('请填写所有必填字段');
        return;
      }
      
      const mode = fileFormContent.dataset.mode;
      const fileId = fileFormContent.dataset.id;
      
      let url = '/add-file';
      if (mode === 'edit') {
        url = `/update-file/${fileId}`;
      }
      
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, links, icon })
      })
      .then(response => {
        if (response.redirected) {
          window.location.href = response.url;
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('操作失败，请重试');
      });
    });
  }
  
  // 只选取卡片里的删除按钮（不选弹窗里的确认删除按钮）
  document.querySelectorAll('.file-card .delete-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const fileCard = btn.closest('.file-card');
      const fileId = btn.dataset.id;
      const fileName = fileCard.querySelector('h3').textContent;
      document.getElementById('deleteFileName').textContent = `你确定要删除文件「${fileName}」吗？此操作不可恢复。`;
      document.getElementById('deleteConfirmModal').style.display = 'flex';
      document.getElementById('deleteConfirmForm').dataset.id = fileId;
    });
  });
  
  document.getElementById('cancelDeleteBtn').onclick = function() {
    document.getElementById('deleteConfirmModal').style.display = 'none';
  };
  
  document.getElementById('deleteConfirmForm').onsubmit = function(e) {
    e.preventDefault();
    const fileId = e.target.dataset.id;
    window.location.href = `/delete-file/${fileId}`;
  };
  
  // 修改密钥弹窗逻辑
  document.getElementById('changeKeyBtn').onclick = function() {
    document.getElementById('changeKeyModal').style.display = 'flex';
  };
  document.getElementById('cancelChangeKeyBtn').onclick = function() {
    document.getElementById('changeKeyModal').style.display = 'none';
  };
  document.getElementById('changeKeyForm').onsubmit = function(e) {
    e.preventDefault();
    const newKey = document.getElementById('newLoginKey').value.trim();
    if (!newKey) {
      alert('请输入新密钥');
      return;
    }
    fetch('/change-login-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newKey })
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message || '修改成功');
      document.getElementById('changeKeyModal').style.display = 'none';
    })
    .catch(() => alert('修改失败，请重试'));
  };
  
  // 编辑推送地址弹窗逻辑
  const editPushUrlBtn = document.getElementById('editPushUrlBtn');
  const editPushUrlModal = document.getElementById('editPushUrlModal');
  const editPushUrlForm = document.getElementById('editPushUrlForm');
  const cancelEditPushUrlBtn = document.getElementById('cancelEditPushUrlBtn');

  if (editPushUrlBtn) {
    editPushUrlBtn.onclick = function() {
      // 预填充
      const urls = window.PUSH_URLS || {};
      document.getElementById('pushAddUrl').value = urls.fileAdd || '';
      document.getElementById('pushEditUrl').value = urls.fileEdit || '';
      document.getElementById('pushDeleteUrl').value = urls.fileDelete || '';
      editPushUrlModal.style.display = 'flex';
    };
  }
  if (cancelEditPushUrlBtn) {
    cancelEditPushUrlBtn.onclick = function() {
      editPushUrlModal.style.display = 'none';
    };
  }
  if (editPushUrlForm) {
    editPushUrlForm.onsubmit = function(e) {
      e.preventDefault();
      const fileAdd = document.getElementById('pushAddUrl').value.trim();
      const fileEdit = document.getElementById('pushEditUrl').value.trim();
      const fileDelete = document.getElementById('pushDeleteUrl').value.trim();
      fetch('/update-push-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileAdd, fileEdit, fileDelete })
      })
      .then(res => res.json())
      .then(data => {
        alert(data.message || '保存成功');
        window.PUSH_URLS = { fileAdd, fileEdit, fileDelete };
        editPushUrlModal.style.display = 'none';
      })
      .catch(() => alert('保存失败，请重试'));
    };
  }
});