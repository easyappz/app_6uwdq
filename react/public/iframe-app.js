// Глобальный обработчик ошибок
window.onerror = function (message, source, lineno, colno, error) {
  // Используем StackTrace для парсинга стека ошибок
  StackTrace.fromError(error).then(stackframes => {
    // Формируем читаемый стек вызовов
    const stackString = stackframes
      .map(sf => `${sf.fileName || 'unknown'}:${sf.lineNumber || '?'}:${sf.columnNumber || '?'}`)
      .join('\n');

    // Формируем объект с данными об ошибке
    const errorData = {
      type: 'error',
      message: message,
      source: source,
      lineno: lineno,
      colno: colno,
      stack: stackString,
      timestamp: new Date().toISOString()
    };

    // Логируем в консоль
    console.error('Глобальная ошибка:', errorData);

    // Отправляем в родительский контекст (для iframe)
    window.parent.postMessage(errorData, '*');
  }).catch(err => {
    // Если не удалось распарсить стек
    console.error('Ошибка при парсинге стека:', err);
    const fallbackErrorData = {
      type: 'error',
      message: message,
      source: source,
      lineno: lineno,
      colno: colno,
      stack: error?.stack || 'Нет данных о стеке',
      timestamp: new Date().toISOString()
    };
    console.error('Глобальная ошибка (запасной вариант):', fallbackErrorData);
    window.parent.postMessage(fallbackErrorData, '*');
  });

  return true; // Предотвращаем стандартный вывод ошибки в консоль
};

// Обработчик необработанных промисов
window.addEventListener('unhandledrejection', function (event) {
  const reason = event.reason;
  // Парсим стек ошибки промиса
  StackTrace.fromError(reason).then(stackframes => {
    const stackString = stackframes
      .map(sf => `${sf.fileName || 'unknown'}:${sf.lineNumber || '?'}:${sf.columnNumber || '?'}`)
      .join('\n');

    const errorData = {
      type: 'promiseError',
      message: reason?.message || 'Необработанная ошибка промиса',
      stack: stackString,
      timestamp: new Date().toISOString()
    };

    // Логируем в консоль
    console.error('Необработанная ошибка промиса:', errorData);

    // Отправляем в родительский контекст
    window.parent.postMessage(errorData, '*');
  }).catch(err => {
    // Если не удалось распарсить стек
    console.error('Ошибка при парсинге стека промиса:', err);
    const fallbackErrorData = {
      type: 'promiseError',
      message: reason?.message || 'Необработанная ошибка промиса',
      stack: reason?.stack || 'Нет данных о стеке',
      timestamp: new Date().toISOString()
    };
    console.error('Необработанная ошибка промиса (запасной вариант):', fallbackErrorData);
    window.parent.postMessage(fallbackErrorData, '*');
  });

  event.preventDefault(); // Предотвращаем стандартный вывод
});

window.handleRoutes = function(pages) {
  console.log('window.handleRoutes', {pages});
  const pagesData = {
    type: 'handlePages',
    timestamp: new Date().toISOString(),
    pages: pages,
  };
  window.parent.postMessage(pagesData, '*');
};

document.addEventListener('DOMContentLoaded', function() {
  // Обработчик сообщений для включения/выключения режима редактирования
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'enableEasyEditMode') {
      document.body.classList.add('easy-mode-edit');
      initEasyTagHandlers();
      console.log('✅ Easy edit mode enabled');
    }
    
    if (event.data && event.data.type === 'disableEasyEditMode') {
      document.body.classList.remove('easy-mode-edit');
      removeEasyTagLabels();
      console.log('❌ Easy edit mode disabled');
    }
  });

  // Функция для создания подсказок с названиями тегов
  function createTagLabels() {
    const elements = document.querySelectorAll('[data-easytag]');
    
    elements.forEach(element => {
      // Проверяем, есть ли уже подсказка
      if (element.querySelector('.easy-tag-label')) {
        return;
      }

      const tagName = element.tagName.toLowerCase();
      const label = document.createElement('div');
      label.className = 'easy-tag-label';
      label.textContent = tagName;

      // Для очень маленьких элементов используем уменьшенную подсказку
      const rect = element.getBoundingClientRect();
      if (rect.width < 50 || rect.height < 30) {
        label.classList.add('small');
      }

      // Для элементов у правого края показываем подсказку справа
      if (rect.left > window.innerWidth - 100) {
        label.classList.add('top-right');
      }

      element.appendChild(label);
    });
  }

  // Функция для удаления всех подсказок
  function removeEasyTagLabels() {
    const labels = document.querySelectorAll('.easy-tag-label');
    labels.forEach(label => {
      label.remove();
    });
  }

  // Функция для инициализации обработчиков событий
  function initEasyTagHandlers() {
    const elements = document.querySelectorAll('[data-easytag]');
    
    // Создаем подсказки при инициализации
    createTagLabels();
    
    elements.forEach(element => {
      element.removeEventListener('click', handleEasyTagClick);
      element.addEventListener('click', handleEasyTagClick);
    });
  }

  // Обработчик клика по элементам с data-easytag
  function handleEasyTagClick(event) {
    if (!document.body.classList.contains('easy-mode-edit')) {
      return;
    }

    event.stopPropagation();
    const easyTagData = this.getAttribute('data-easytag');
    const tagName = this.tagName.toLowerCase();
    
    console.log('Clicked element:', { 
      tag: tagName, 
      data: easyTagData 
    });
    
    window.parent.postMessage({
      type: 'easyTagClick',
      timestamp: new Date().toISOString(),
      data: easyTagData,
      tagName: tagName,
      elementInfo: {
        tag: tagName,
        classes: this.className,
        id: this.id
      }
    }, '*');

    event.preventDefault();
  }

  // Наблюдатель за изменениями DOM
  const observer = new MutationObserver(function(mutations) {
    let shouldInit = false;
    
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) {
          if (node.hasAttribute('data-easytag') || 
              node.querySelector('[data-easytag]')) {
            shouldInit = true;
          }
        }
      });
    });
    
    if (shouldInit && document.body.classList.contains('easy-mode-edit')) {
      setTimeout(() => {
        initEasyTagHandlers();
      }, 10);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Инициализация при загрузке, если режим уже активен
  if (document.body.classList.contains('easy-mode-edit')) {
    initEasyTagHandlers();
  }
});
