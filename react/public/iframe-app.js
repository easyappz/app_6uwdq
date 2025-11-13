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
  let currentHoverElement = null;

  // Обработчик сообщений для включения/выключения режима редактирования
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'enableEasyEditMode') {
      document.body.classList.add('easy-mode-edit');
      initEasyTagHandlers();
      console.log('✅ Easy edit mode enabled');
    }
    
    if (event.data && event.data.type === 'disableEasyEditMode') {
      document.body.classList.remove('easy-mode-edit');
      removeEasyTagHandlers();
      console.log('❌ Easy edit mode disabled');
    }
  });

  // Функция для удаления всех обработчиков
  function removeEasyTagHandlers() {
    const elements = document.querySelectorAll('[data-easytag]');
    
    elements.forEach(element => {
      element.removeEventListener('click', handleEasyTagClick);
      element.removeEventListener('mouseover', handleMouseOver);
      element.removeEventListener('mouseout', handleMouseOut);
      
      // Удаляем подсказку если она есть и классы
      if (element._easyTagLabel) {
        element._easyTagLabel.remove();
        element._easyTagLabel = null;
      }
      element.classList.remove('easy-hover-active');
    });
    
    currentHoverElement = null;
  }

  // Обработчики для показа/скрытия подсказки
  function handleMouseOver(event) {
    event.stopPropagation();
    
    // Находим ближайший элемент с data-easytag
    const easyTagElement = event.target.closest('[data-easytag]');
    if (!easyTagElement) return;
    
    // Если это уже текущий элемент, ничего не делаем
    if (easyTagElement === currentHoverElement) return;
    
    // Убираем выделение с предыдущего элемента
    if (currentHoverElement) {
      currentHoverElement.classList.remove('easy-hover-active');
      if (currentHoverElement._easyTagLabel) {
        currentHoverElement._easyTagLabel.remove();
        currentHoverElement._easyTagLabel = null;
      }
    }
    
    // Устанавливаем новый текущий элемент
    currentHoverElement = easyTagElement;
    
    // Создаем подсказку
    if (!easyTagElement._easyTagLabel) {
      const tagName = easyTagElement.tagName.toLowerCase();
      const label = document.createElement('div');
      label.className = 'easy-tag-label';
      label.textContent = tagName;

      // Для очень маленьких элементов используем уменьшенную подсказку
      const rect = easyTagElement.getBoundingClientRect();
      if (rect.width < 50 || rect.height < 30) {
        label.classList.add('small');
      }

      // Для элементов у правого края показываем подсказку справа
      if (rect.left > window.innerWidth - 100) {
        label.classList.add('top-right');
      }

      easyTagElement.appendChild(label);
      easyTagElement._easyTagLabel = label;
    }
    
    // Добавляем класс выделения
    easyTagElement.classList.add('easy-hover-active');
  }

  function handleMouseOut(event) {
    event.stopPropagation();
    
    // Проверяем, покидаем ли мы текущий элемент
    const relatedTarget = event.relatedTarget;
    if (!relatedTarget || !currentHoverElement) return;
    
    // Если мы переходим на элемент, который не является потомком текущего элемента
    if (!currentHoverElement.contains(relatedTarget)) {
      currentHoverElement.classList.remove('easy-hover-active');
      if (currentHoverElement._easyTagLabel) {
        currentHoverElement._easyTagLabel.remove();
        currentHoverElement._easyTagLabel = null;
      }
      currentHoverElement = null;
    }
  }

  // Функция для инициализации обработчиков событий
  function initEasyTagHandlers() {
    const elements = document.querySelectorAll('[data-easytag]');
    
    elements.forEach(element => {
      // Удаляем старые обработчики
      element.removeEventListener('click', handleEasyTagClick);
      element.removeEventListener('mouseover', handleMouseOver);
      element.removeEventListener('mouseout', handleMouseOut);
      
      // Добавляем новые обработчики
      element.addEventListener('click', handleEasyTagClick);
      element.addEventListener('mouseover', handleMouseOver);
      element.addEventListener('mouseout', handleMouseOut);
    });
  }

  // Обработчик клика по элементам с data-easytag
  function handleEasyTagClick(event) {
    if (!document.body.classList.contains('easy-mode-edit')) {
      return;
    }

    event.stopPropagation();
    const easyTagElement = event.target.closest('[data-easytag]');
    if (!easyTagElement) return;
    
    const easyTagData = easyTagElement.getAttribute('data-easytag');
    const tagName = easyTagElement.tagName.toLowerCase();
    
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
        classes: easyTagElement.className,
        id: easyTagElement.id
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
