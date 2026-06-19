
(function() {
        JSAV._types.ds.BinaryTreeNode.prototype.rotateLeft = function () {
            // 如果没有右子节点或是空节点则不能旋转
            if (!this.right() || this.right().hasClass("emptynode")) {
                return false;
            }

            var parent = this.parent();
            var raisedNode;

            // 如果有父节点，记录是左子还是右子（0 = left, 1 = right）
            var lr;
            if (parent) {
                lr = (parent.left() === this) ? 0 : 1;
            }

            // 1) 将 this 的右子（将要上升的节点）从原位置移除，但不 hide
            var candidate = this.right().remove({hide: false});

            // 2) 如果有父节点，把 candidate 挂到 parent 的相应子位；否则把 candidate 设为树根
            if (parent) {
                parent.child(lr, candidate, {hide: false});
                raisedNode = parent.child(lr);
            } else {
                // container.root 接受第二个参数选项
                this.container.root(candidate, {hide: false});
                raisedNode = this.container.root();
            }

            // 3) 把 raisedNode 的左子（如果存在）接回到 this 的右子
            if (raisedNode.left()) {
                // remove left child from raisedNode but不 hide，然后挂到 this.right
                this.right(raisedNode.left().remove({hide: false}));
            } else {
                // 如果没有左子，确保 this.right 断开（避免旧引用）
                this.right(null);
            }

            // 4) 把 this 挂到 raisedNode 的左子
            raisedNode.left(this);

            return true;
            };

        JSAV._types.ds.BinaryTreeNode.prototype.rotateRight = function () {
            // 如果没有左子节点或是空节点则不能旋转
            if (!this.left() || this.left().hasClass("emptynode")) {
                return false;
            }

            var parent = this.parent();
            var raisedNode;

            var lr;
            if (parent) {
                lr = (parent.left() === this) ? 0 : 1;
            }

            // 1) 将 this 的左子（将要上升的节点）从原位置移除，但不 hide
            var candidate = this.left().remove({hide: false});

            // 2) 把 candidate 挂到 parent 的相应子位或设为根
            if (parent) {
                parent.child(lr, candidate, {hide: false});
                raisedNode = parent.child(lr);
            } else {
                this.container.root(candidate, {hide: false});
                raisedNode = this.container.root();
            }

            // 3) 把 raisedNode 的右子（如果存在）接回到 this 的左子
            if (raisedNode.right()) {
                this.left(raisedNode.right().remove({hide: false}));
            } else {
                this.left(null);
            }

            // 4) 把 this 挂到 raisedNode 的右子
            raisedNode.right(this);

            return true;
        };
})();