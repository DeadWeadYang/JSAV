


(function () {
    JSAV._types.ds.TreeNode.prototype.parent = function (newParent, options) {
        if (typeof newParent === "undefined") {
            return this.parentnode;
        } else {
            if (!this._edgetoparent) {
                this._setEdgeToParent(new this.constructors.Edge(this.jsav, this, newParent, options));
            }
            this._setparent(newParent, options);

            // if both this node and parent are visible but the edge is not, show it
            if (this.isVisible() && newParent && newParent.isVisible() && !this._edgetoparent.isVisible()) {
                this._edgetoparent.show();
            } else if ((!this.isVisible() || !newParent || !newParent.isVisible()) && this._edgetoparent.isVisible()) {
                // if either this node or new parent are invisible but the edge is not,
                // -> hide the edge to parent
                this._edgetoparent.hide();
            }
            return this;
        }
    };
})();