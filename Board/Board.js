document.addEventListener('DOMContentLoaded', () => {

    // Lấy các phần tử (element) chính
    const mainContainer = document.getElementById('main-container');
    const toggleTask = document.getElementById('toggle-task');
    const toggleCalendar = document.getElementById('toggle-calendar');
    const toggleBoard = document.getElementById('toggle-board');

    const taskColumn = document.getElementById('task-column');
    const calendarColumn = document.getElementById('calendar-column');
    const boardColumn = document.getElementById('board-column');

    const taskResizer = document.querySelector('.resizer[data-prev-id="task-column"]');
    const calendarResizer = document.querySelector('.resizer[data-prev-id="calendar-column"]');

    const addListTrigger = document.querySelector('.add-list-trigger');
    const addListForm = document.querySelector('.add-list-form');
    const cancelListBtn = document.querySelector('.cancel-list-btn');
    const boardListsContainer = document.getElementById('board-lists');

    // --- 1. Chức năng Ẩn/Hiện Cột ---
    toggleTask.addEventListener('click', () => {
        taskColumn.classList.toggle('hidden');
        taskResizer.classList.toggle('hidden');
        toggleTask.classList.toggle('active');
    });

    toggleCalendar.addEventListener('click', () => {
        calendarColumn.classList.toggle('hidden');
        calendarResizer.classList.toggle('hidden');
        toggleCalendar.classList.toggle('active');
    });

    toggleBoard.addEventListener('click', () => {
        boardColumn.classList.toggle('hidden');
        toggleBoard.classList.toggle('active');
    });

    // --- 2. Chức năng Thêm Thẻ (Add Card) ---
    mainContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-card-trigger')) {
            const trigger = e.target;
            const form = trigger.nextElementSibling;
            form.style.display = 'block';
            trigger.style.display = 'none';
        }
        if (e.target.classList.contains('cancel-card-btn')) {
            const form = e.target.closest('.add-card-form');
            const trigger = form.previousElementSibling;
            form.style.display = 'none';
            trigger.style.display = 'block';
            form.reset();
        }
    });

    mainContainer.addEventListener('submit', (e) => {
        if (e.target.classList.contains('add-card-form')) {
            e.preventDefault();
            const form = e.target;
            const textarea = form.querySelector('textarea');
            const cardText = textarea.value.trim();

            if (cardText) {
                const cardList = form.closest('.board-column, .list').querySelector('.card-list');
                const newCard = createCard(cardText);
                cardList.appendChild(newCard);
                form.reset();
                form.style.display = 'none';
                form.previousElementSibling.style.display = 'block';
            }
        }
    });

    function createCard(text) {
        const card = document.createElement('div');
        card.className = 'card';
        card.draggable = true;
        card.textContent = text;
        return card;
    }

    // --- 3. Chức năng Thêm Danh Sách (Add List) ---
    addListTrigger.addEventListener('click', () => {
        addListTrigger.style.display = 'none';
        addListForm.style.display = 'block';
        addListForm.querySelector('input').focus();
    });

    cancelListBtn.addEventListener('click', () => {
        addListTrigger.style.display = 'block';
        addListForm.style.display = 'none';
        addListForm.reset();
    });

    addListForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = addListForm.querySelector('input');
        const listTitle = input.value.trim();

        if (listTitle) {
            const newList = createList(listTitle);
            boardListsContainer.appendChild(newList);
            addListForm.reset();
            addListForm.style.display = 'none';
            addListTrigger.style.display = 'block';
        }
    });

    function createList(title) {
        const list = document.createElement('div');
        list.className = 'list';
        list.innerHTML = `
            <h4>${title}</h4>
            <div class="card-list">
            </div>
            <div class="add-card-container">
                <div class="add-card-trigger">Add a card</div>
                <form class="add-card-form">
                    <textarea placeholder="Enter card text..."></textarea>
                    <div class="form-controls">
                        <button type="submit">Create</button>
                        <button type="button" class="cancel-card-btn">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        return list;
    }
    
    // --- 4. Chức năng Kéo và Thả (Drag and Drop) ---
    let draggingCard = null;

    mainContainer.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('card')) {
            draggingCard = e.target;
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }
    });

    mainContainer.addEventListener('dragend', (e) => {
        if (draggingCard) {
            draggingCard.classList.remove('dragging');
            draggingCard = null;
        }
    });

    mainContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    mainContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggingCard) {
            const dropZone = e.target.closest('.card-list');
            if (dropZone) {
                dropZone.appendChild(draggingCard);
            }
        }
    });


    // --- 5. Chức năng Thay Đổi Kích Thước Cột ---
    
    function initResizing() {
        let isResizing = false;
        let currentResizer = null;
        let prevColumn = null;
        let startX = 0;
        let startWidth = 0;

        mainContainer.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('resizer')) {
                e.preventDefault();
                isResizing = true;
                currentResizer = e.target;
                
                const prevId = currentResizer.getAttribute('data-prev-id');
                prevColumn = document.getElementById(prevId);
                
                if (!prevColumn) return;

                startX = e.clientX;
                startWidth = prevColumn.getBoundingClientRect().width;
                
                currentResizer.classList.add('is-dragging');
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            }
        });

        // HÀM ĐÃ ĐƯỢC CẬP NHẬT
        function handleMouseMove(e) {
            if (!isResizing) return;

            const dx = e.clientX - startX; // Độ thay đổi của chuột
            const newWidth = startWidth + dx;
            
            // Đặt giới hạn chiều rộng tối thiểu (ví dụ 100px)
            const minWidth = 100; 

            if (newWidth > minWidth) { 
                // Nếu vẫn lớn hơn min, chỉ cần cập nhật kích thước
                prevColumn.style.flexBasis = `${newWidth}px`;
            } else {
                // Nếu nhỏ hơn hoặc bằng min, hãy "tắt" cột đó
                
                // 1. Kiểm tra xem đó là cột nào và 'click' nút toggle tương ứng
                if (prevColumn.id === 'task-column') {
                    toggleTask.click(); // Giống như người dùng tự tay nhấn nút
                } else if (prevColumn.id === 'calendar-column') {
                    toggleCalendar.click(); // Giống như người dùng tự tay nhấn nút
                }
                
                // 2. Dừng thao tác kéo ngay lập tức
                //    (Vì cột và resizer sắp biến mất)
                handleMouseUp();
            }
        }

        function handleMouseUp() {
            if (!isResizing) return;
            isResizing = false;
            if (currentResizer) {
                currentResizer.classList.remove('is-dragging');
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            currentResizer = null;
            prevColumn = null;
        }
    }
    
    initResizing();

});