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

    // --- HELPER FUNCTIONS (MỚI) ---
    // (Đặt các hàm này ngay sau khi lấy element, trước khi dùng)

    /** Đếm số lượng cột đang hiển thị */
    function getVisibleColumnsCount() {
        let count = 0;
        if (!taskColumn.classList.contains('hidden')) count++;
        if (!calendarColumn.classList.contains('hidden')) count++;
        if (!boardColumn.classList.contains('hidden')) count++;
        return count;
    }

    /**
     * Logic bật/tắt cột.
     * Trả về `true` nếu thành công, `false` nếu bị chặn (do là cột cuối).
     */
    function toggleColumn(column, resizer, button) {
        const isHiding = !column.classList.contains('hidden');
        
        if (isHiding && getVisibleColumnsCount() <= 1) {
            // Không thể ẩn cột cuối cùng
            console.warn("Không thể ẩn cột cuối cùng.");
            // Có thể thêm alert() ở đây nếu muốn
            return false; // Báo thất bại
        }

        column.classList.toggle('hidden');
        
        // Cột Board không có resizer bên phải nó, nên `resizer` có thể null
        if (resizer) {
            resizer.classList.toggle('hidden');
        }
        button.classList.toggle('active');
        return true; // Báo thành công
    }

    // --- 1. Chức năng Ẩn/Hiện Cột (ĐÃ CẬP NHẬT) ---
    toggleTask.addEventListener('click', () => {
        toggleColumn(taskColumn, taskResizer, toggleTask);
    });

    toggleCalendar.addEventListener('click', () => {
        toggleColumn(calendarColumn, calendarResizer, toggleCalendar);
    });

    toggleBoard.addEventListener('click', () => {
        toggleColumn(boardColumn, null, toggleBoard); // Cột Board không có resizer đi kèm
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


    function initResizing() {
        let isResizing = false;
        let currentResizer = null;
        let prevColumn = null;
        let nextColumn = null; // Cột kế tiếp
        let startX = 0;
        let prevStartWidth = 0; // Chiều rộng cột trước
        let nextStartWidth = 0; // Chiều rộng cột sau

        mainContainer.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('resizer')) {
                e.preventDefault();
                isResizing = true;
                currentResizer = e.target;
                
                const prevId = currentResizer.getAttribute('data-prev-id');
                prevColumn = document.getElementById(prevId);

                // --- TÌM CỘT TIẾP THEO (MỚI) ---
                // Tìm cột 'board-column' đầu tiên đang hiển thị (không 'hidden')
                // nằm sau cái resizer này.
                let nextEl = currentResizer.nextElementSibling;
                while (nextEl) {
                    if (nextEl.classList.contains('board-column') && !nextEl.classList.contains('hidden')) {
                        nextColumn = nextEl; // Đã tìm thấy
                        break;
                    }
                    nextEl = nextEl.nextElementSibling;
                }
                // --- KẾT THÚC TÌM ---

                if (!prevColumn || !nextColumn) {
                    // Nếu không tìm thấy 1 trong 2 cột, không làm gì cả
                    isResizing = false;
                    return;
                }

                startX = e.clientX;
                prevStartWidth = prevColumn.getBoundingClientRect().width;
                nextStartWidth = nextColumn.getBoundingClientRect().width;
                
                // --- "ĐÓNG BĂNG" KÍCH THƯỚC (FIX LỖI GIẬT) ---
                // Set flex-basis cho tất cả các cột đang hiển thị
                // để ngăn flex-grow/shrink tính toán lại khi kéo.
                const allVisibleColumns = document.querySelectorAll('.board-column:not(.hidden)');
                allVisibleColumns.forEach(col => {
                    col.style.flexBasis = col.getBoundingClientRect().width + 'px';
                    col.style.flexGrow = '0'; // Tắt grow/shrink
                    col.style.flexShrink = '0';
                });
                // --- KẾT THÚC ĐÓNG BĂNG ---
                
                currentResizer.classList.add('is-dragging');
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            }
        });

        // HÀM ĐÃ ĐƯỢC CẬP NHẬT
        function handleMouseMove(e) {
            if (!isResizing) return;

            e.preventDefault(); // Ngăn chọn text
            
            const dx = e.clientX - startX;
            const newPrevWidth = prevStartWidth + dx; // Cột trước to ra
            const newNextWidth = nextStartWidth - dx; // Cột sau nhỏ lại
            
            const minWidth = 100; // Giới hạn chiều rộng tối thiểu

            // Logic ẩn cột (khi kéo quá nhỏ)
            if (newPrevWidth < minWidth) {
                // Thử ẩn cột TRƯỚC
                let toggleSuccess = false;
                if (prevColumn.id === 'task-column') {
                    toggleSuccess = toggleColumn(taskColumn, taskResizer, toggleTask);
                } else if (prevColumn.id === 'calendar-column') {
                    toggleSuccess = toggleColumn(calendarColumn, calendarResizer, toggleCalendar);
                }
                
                if (toggleSuccess) {
                    handleMouseUp(); // Dừng kéo nếu ẩn thành công
                }
                return; // Không làm gì nữa
            }
            
            if (newNextWidth < minWidth) {
                // Thử ẩn cột SAU
                let toggleSuccess = false;
                if (nextColumn.id === 'calendar-column') {
                    toggleSuccess = toggleColumn(calendarColumn, calendarResizer, toggleCalendar);
                } else if (nextColumn.id === 'board-column') {
                    toggleSuccess = toggleColumn(boardColumn, null, toggleBoard);
                }
                
                if (toggleSuccess) {
                    handleMouseUp(); // Dừng kéo nếu ẩn thành công
                }
                return; // Không làm gì nữa
            }

            // Nếu cả hai đều ổn, cập nhật cả hai
            prevColumn.style.flexBasis = `${newPrevWidth}px`;
            nextColumn.style.flexBasis = `${newNextWidth}px`;
        }

        // HÀM ĐÃ ĐƯỢC CẬP NHẬT
        function handleMouseUp() {
            if (!isResizing) return;
            isResizing = false;
            
            if (currentResizer) {
                currentResizer.classList.remove('is-dragging');
            }
            
            // --- "RÃ ĐÔNG" CÁC CỘT (ĐÃ SỬA) ---
            // Chúng ta chỉ xóa 'grow' và 'shrink' để chúng quay về CSS default (là 1)
            // NHƯNG GIỮ LẠI 'flex-basis' (kích thước pixel) mà người dùng đã kéo.
            const allColumns = document.querySelectorAll('.board-column');
            allColumns.forEach(col => {
                // col.style.flexBasis = null; // <-- XÓA BỎ DÒNG NÀY
                col.style.flexGrow = null;
                col.style.flexShrink = null;
            });
            // --- KẾT THÚC RÃ ĐÔNG ---
            
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            // Reset
            currentResizer = null;
            prevColumn = null;
            nextColumn = null;
            prevStartWidth = 0;
            nextStartWidth = 0;
        }   
    }
    
    initResizing();

    // --- 6. Chức năng Kéo Footer (MÃ MỚI) ---
    
    const draggableFooter = document.querySelector('.app-footer');
    let isDraggingFooter = false;
    let footerOffsetX = 0;
    let hasDragged = false; // Biến để kiểm tra xem có phải là click hay kéo

    draggableFooter.addEventListener('mousedown', (e) => {
        // Chỉ bắt đầu kéo nếu click vào nền footer (không phải nút)
        // HOẶC nếu click vào nút nhưng không phải nút "Switch Boards"
        // (Chúng ta giả định mọi nút đều có thể dùng để kéo)
        
        isDraggingFooter = true;
        hasDragged = false; // Reset cờ "đã kéo"
        draggableFooter.classList.add('dragging');

        // Lấy vị trí 'left' hiện tại
        // Lần đầu tiên, nó sẽ là 50% và có transform.
        // Chúng ta cần chuyển nó sang pixel.
        const rect = draggableFooter.getBoundingClientRect();
        
        // Chuyển đổi vị trí sang pixel tuyệt đối
        // và loại bỏ transform để tránh xung đột
        if (getComputedStyle(draggableFooter).transform !== 'none') {
             draggableFooter.style.left = `${rect.left}px`;
             draggableFooter.style.transform = 'none';
        }

        // Tính toán độ lệch của chuột so với lề trái của footer
        footerOffsetX = e.clientX - rect.left;

        document.addEventListener('mousemove', onFooterMove);
        document.addEventListener('mouseup', onFooterUp);
    });

    function onFooterMove(e) {
        if (!isDraggingFooter) return;
        
        hasDragged = true; // Đánh dấu là người dùng đã kéo
        e.preventDefault(); // Ngăn các hành vi mặc định (như chọn text)

        let newLeft = e.clientX - footerOffsetX;
        
        // Giới hạn kéo, không cho footer ra khỏi màn hình
        const minLeft = 10; // Cách lề trái 10px
        const maxLeft = window.innerWidth - draggableFooter.offsetWidth - 10; // Cách lề phải 10px

        if (newLeft < minLeft) newLeft = minLeft;
        if (newLeft > maxLeft) newLeft = maxLeft;

        draggableFooter.style.left = `${newLeft}px`;
    }

    function onFooterUp() {
        if (!isDraggingFooter) return;

        isDraggingFooter = false;
        draggableFooter.classList.remove('dragging');
        document.removeEventListener('mousemove', onFooterMove);
        document.removeEventListener('mouseup', onFooterUp);
    }

    // Cập nhật: Ngăn các nút kích hoạt sự kiện click nếu đang kéo
    // Chúng ta cần thêm một 'capture' listener
    draggableFooter.addEventListener('click', (e) => {
        if (hasDragged) {
            e.stopPropagation(); // Ngăn sự kiện click (toggle) nếu đó là một cú kéo
            e.preventDefault();
        }
    }, true); // 'true' để chạy ở 'capture' phase

});