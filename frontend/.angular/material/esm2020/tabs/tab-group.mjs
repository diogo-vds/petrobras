/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, Directive, ElementRef, EventEmitter, Inject, Input, Optional, Output, QueryList, ViewChild, ViewEncapsulation, } from '@angular/core';
import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';
import { MAT_TAB_GROUP, MatTab } from './tab';
import { MatTabHeader } from './tab-header';
import { coerceBooleanProperty, coerceNumberProperty, } from '@angular/cdk/coercion';
import { mixinColor, mixinDisableRipple, } from '@angular/material/core';
import { merge, Subscription } from 'rxjs';
import { MAT_TABS_CONFIG } from './tab-config';
import { startWith } from 'rxjs/operators';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
import * as i2 from "@angular/cdk/portal";
import * as i3 from "@angular/material/core";
import * as i4 from "@angular/cdk/a11y";
import * as i5 from "./tab-body";
import * as i6 from "./tab-label-wrapper";
import * as i7 from "./tab-header";
/** Used to generate unique ID's for each tab component */
let nextId = 0;
// Boilerplate for applying mixins to MatTabGroup.
/** @docs-private */
const _MatTabGroupMixinBase = mixinColor(mixinDisableRipple(class {
    constructor(_elementRef) {
        this._elementRef = _elementRef;
    }
}), 'primary');
/**
 * Base class with all of the `MatTabGroupBase` functionality.
 * @docs-private
 */
export class _MatTabGroupBase extends _MatTabGroupMixinBase {
    constructor(elementRef, _changeDetectorRef, defaultConfig, _animationMode) {
        super(elementRef);
        this._changeDetectorRef = _changeDetectorRef;
        this._animationMode = _animationMode;
        /** All of the tabs that belong to the group. */
        this._tabs = new QueryList();
        /** The tab index that should be selected after the content has been checked. */
        this._indexToSelect = 0;
        /** Index of the tab that was focused last. */
        this._lastFocusedTabIndex = null;
        /** Snapshot of the height of the tab body wrapper before another tab is activated. */
        this._tabBodyWrapperHeight = 0;
        /** Subscription to tabs being added/removed. */
        this._tabsSubscription = Subscription.EMPTY;
        /** Subscription to changes in the tab labels. */
        this._tabLabelSubscription = Subscription.EMPTY;
        this._dynamicHeight = false;
        this._selectedIndex = null;
        /** Position of the tab header. */
        this.headerPosition = 'above';
        this._disablePagination = false;
        this._preserveContent = false;
        /** Output to enable support for two-way binding on `[(selectedIndex)]` */
        this.selectedIndexChange = new EventEmitter();
        /** Event emitted when focus has changed within a tab group. */
        this.focusChange = new EventEmitter();
        /** Event emitted when the body animation has completed */
        this.animationDone = new EventEmitter();
        /** Event emitted when the tab selection has changed. */
        this.selectedTabChange = new EventEmitter(true);
        this._groupId = nextId++;
        this.animationDuration =
            defaultConfig && defaultConfig.animationDuration ? defaultConfig.animationDuration : '500ms';
        this.disablePagination =
            defaultConfig && defaultConfig.disablePagination != null
                ? defaultConfig.disablePagination
                : false;
        this.dynamicHeight =
            defaultConfig && defaultConfig.dynamicHeight != null ? defaultConfig.dynamicHeight : false;
        this.contentTabIndex = defaultConfig?.contentTabIndex ?? null;
        this.preserveContent = !!defaultConfig?.preserveContent;
    }
    /** Whether the tab group should grow to the size of the active tab. */
    get dynamicHeight() {
        return this._dynamicHeight;
    }
    set dynamicHeight(value) {
        this._dynamicHeight = coerceBooleanProperty(value);
    }
    /** The index of the active tab. */
    get selectedIndex() {
        return this._selectedIndex;
    }
    set selectedIndex(value) {
        this._indexToSelect = coerceNumberProperty(value, null);
    }
    /** Duration for the tab animation. Will be normalized to milliseconds if no units are set. */
    get animationDuration() {
        return this._animationDuration;
    }
    set animationDuration(value) {
        this._animationDuration = /^\d+$/.test(value + '') ? value + 'ms' : value;
    }
    /**
     * `tabindex` to be set on the inner element that wraps the tab content. Can be used for improved
     * accessibility when the tab does not have focusable elements or if it has scrollable content.
     * The `tabindex` will be removed automatically for inactive tabs.
     * Read more at https://www.w3.org/TR/wai-aria-practices/examples/tabs/tabs-2/tabs.html
     */
    get contentTabIndex() {
        return this._contentTabIndex;
    }
    set contentTabIndex(value) {
        this._contentTabIndex = coerceNumberProperty(value, null);
    }
    /**
     * Whether pagination should be disabled. This can be used to avoid unnecessary
     * layout recalculations if it's known that pagination won't be required.
     */
    get disablePagination() {
        return this._disablePagination;
    }
    set disablePagination(value) {
        this._disablePagination = coerceBooleanProperty(value);
    }
    /**
     * By default tabs remove their content from the DOM while it's off-screen.
     * Setting this to `true` will keep it in the DOM which will prevent elements
     * like iframes and videos from reloading next time it comes back into the view.
     */
    get preserveContent() {
        return this._preserveContent;
    }
    set preserveContent(value) {
        this._preserveContent = coerceBooleanProperty(value);
    }
    /** Background color of the tab group. */
    get backgroundColor() {
        return this._backgroundColor;
    }
    set backgroundColor(value) {
        const classList = this._elementRef.nativeElement.classList;
        classList.remove('mat-tabs-with-background', `mat-background-${this.backgroundColor}`);
        if (value) {
            classList.add('mat-tabs-with-background', `mat-background-${value}`);
        }
        this._backgroundColor = value;
    }
    /**
     * After the content is checked, this component knows what tabs have been defined
     * and what the selected index should be. This is where we can know exactly what position
     * each tab should be in according to the new selected index, and additionally we know how
     * a new selected tab should transition in (from the left or right).
     */
    ngAfterContentChecked() {
        // Don't clamp the `indexToSelect` immediately in the setter because it can happen that
        // the amount of tabs changes before the actual change detection runs.
        const indexToSelect = (this._indexToSelect = this._clampTabIndex(this._indexToSelect));
        // If there is a change in selected index, emit a change event. Should not trigger if
        // the selected index has not yet been initialized.
        if (this._selectedIndex != indexToSelect) {
            const isFirstRun = this._selectedIndex == null;
            if (!isFirstRun) {
                this.selectedTabChange.emit(this._createChangeEvent(indexToSelect));
                // Preserve the height so page doesn't scroll up during tab change.
                // Fixes https://stackblitz.com/edit/mat-tabs-scroll-page-top-on-tab-change
                const wrapper = this._tabBodyWrapper.nativeElement;
                wrapper.style.minHeight = wrapper.clientHeight + 'px';
            }
            // Changing these values after change detection has run
            // since the checked content may contain references to them.
            Promise.resolve().then(() => {
                this._tabs.forEach((tab, index) => (tab.isActive = index === indexToSelect));
                if (!isFirstRun) {
                    this.selectedIndexChange.emit(indexToSelect);
                    // Clear the min-height, this was needed during tab change to avoid
                    // unnecessary scrolling.
                    this._tabBodyWrapper.nativeElement.style.minHeight = '';
                }
            });
        }
        // Setup the position for each tab and optionally setup an origin on the next selected tab.
        this._tabs.forEach((tab, index) => {
            tab.position = index - indexToSelect;
            // If there is already a selected tab, then set up an origin for the next selected tab
            // if it doesn't have one already.
            if (this._selectedIndex != null && tab.position == 0 && !tab.origin) {
                tab.origin = indexToSelect - this._selectedIndex;
            }
        });
        if (this._selectedIndex !== indexToSelect) {
            this._selectedIndex = indexToSelect;
            this._lastFocusedTabIndex = null;
            this._changeDetectorRef.markForCheck();
        }
    }
    ngAfterContentInit() {
        this._subscribeToAllTabChanges();
        this._subscribeToTabLabels();
        // Subscribe to changes in the amount of tabs, in order to be
        // able to re-render the content as new tabs are added or removed.
        this._tabsSubscription = this._tabs.changes.subscribe(() => {
            const indexToSelect = this._clampTabIndex(this._indexToSelect);
            // Maintain the previously-selected tab if a new tab is added or removed and there is no
            // explicit change that selects a different tab.
            if (indexToSelect === this._selectedIndex) {
                const tabs = this._tabs.toArray();
                let selectedTab;
                for (let i = 0; i < tabs.length; i++) {
                    if (tabs[i].isActive) {
                        // Assign both to the `_indexToSelect` and `_selectedIndex` so we don't fire a changed
                        // event, otherwise the consumer may end up in an infinite loop in some edge cases like
                        // adding a tab within the `selectedIndexChange` event.
                        this._indexToSelect = this._selectedIndex = i;
                        this._lastFocusedTabIndex = null;
                        selectedTab = tabs[i];
                        break;
                    }
                }
                // If we haven't found an active tab and a tab exists at the selected index, it means
                // that the active tab was swapped out. Since this won't be picked up by the rendering
                // loop in `ngAfterContentChecked`, we need to sync it up manually.
                if (!selectedTab && tabs[indexToSelect]) {
                    Promise.resolve().then(() => {
                        tabs[indexToSelect].isActive = true;
                        this.selectedTabChange.emit(this._createChangeEvent(indexToSelect));
                    });
                }
            }
            this._changeDetectorRef.markForCheck();
        });
    }
    /** Listens to changes in all of the tabs. */
    _subscribeToAllTabChanges() {
        // Since we use a query with `descendants: true` to pick up the tabs, we may end up catching
        // some that are inside of nested tab groups. We filter them out manually by checking that
        // the closest group to the tab is the current one.
        this._allTabs.changes.pipe(startWith(this._allTabs)).subscribe((tabs) => {
            this._tabs.reset(tabs.filter(tab => {
                return tab._closestTabGroup === this || !tab._closestTabGroup;
            }));
            this._tabs.notifyOnChanges();
        });
    }
    ngOnDestroy() {
        this._tabs.destroy();
        this._tabsSubscription.unsubscribe();
        this._tabLabelSubscription.unsubscribe();
    }
    /** Re-aligns the ink bar to the selected tab element. */
    realignInkBar() {
        if (this._tabHeader) {
            this._tabHeader._alignInkBarToSelectedTab();
        }
    }
    /**
     * Recalculates the tab group's pagination dimensions.
     *
     * WARNING: Calling this method can be very costly in terms of performance. It should be called
     * as infrequently as possible from outside of the Tabs component as it causes a reflow of the
     * page.
     */
    updatePagination() {
        if (this._tabHeader) {
            this._tabHeader.updatePagination();
        }
    }
    /**
     * Sets focus to a particular tab.
     * @param index Index of the tab to be focused.
     */
    focusTab(index) {
        const header = this._tabHeader;
        if (header) {
            header.focusIndex = index;
        }
    }
    _focusChanged(index) {
        this._lastFocusedTabIndex = index;
        this.focusChange.emit(this._createChangeEvent(index));
    }
    _createChangeEvent(index) {
        const event = new MatTabChangeEvent();
        event.index = index;
        if (this._tabs && this._tabs.length) {
            event.tab = this._tabs.toArray()[index];
        }
        return event;
    }
    /**
     * Subscribes to changes in the tab labels. This is needed, because the @Input for the label is
     * on the MatTab component, whereas the data binding is inside the MatTabGroup. In order for the
     * binding to be updated, we need to subscribe to changes in it and trigger change detection
     * manually.
     */
    _subscribeToTabLabels() {
        if (this._tabLabelSubscription) {
            this._tabLabelSubscription.unsubscribe();
        }
        this._tabLabelSubscription = merge(...this._tabs.map(tab => tab._stateChanges)).subscribe(() => this._changeDetectorRef.markForCheck());
    }
    /** Clamps the given index to the bounds of 0 and the tabs length. */
    _clampTabIndex(index) {
        // Note the `|| 0`, which ensures that values like NaN can't get through
        // and which would otherwise throw the component into an infinite loop
        // (since Math.max(NaN, 0) === NaN).
        return Math.min(this._tabs.length - 1, Math.max(index || 0, 0));
    }
    /** Returns a unique id for each tab label element */
    _getTabLabelId(i) {
        return `mat-tab-label-${this._groupId}-${i}`;
    }
    /** Returns a unique id for each tab content element */
    _getTabContentId(i) {
        return `mat-tab-content-${this._groupId}-${i}`;
    }
    /**
     * Sets the height of the body wrapper to the height of the activating tab if dynamic
     * height property is true.
     */
    _setTabBodyWrapperHeight(tabHeight) {
        if (!this._dynamicHeight || !this._tabBodyWrapperHeight) {
            return;
        }
        const wrapper = this._tabBodyWrapper.nativeElement;
        wrapper.style.height = this._tabBodyWrapperHeight + 'px';
        // This conditional forces the browser to paint the height so that
        // the animation to the new height can have an origin.
        if (this._tabBodyWrapper.nativeElement.offsetHeight) {
            wrapper.style.height = tabHeight + 'px';
        }
    }
    /** Removes the height of the tab body wrapper. */
    _removeTabBodyWrapperHeight() {
        const wrapper = this._tabBodyWrapper.nativeElement;
        this._tabBodyWrapperHeight = wrapper.clientHeight;
        wrapper.style.height = '';
        this.animationDone.emit();
    }
    /** Handle click events, setting new selected index if appropriate. */
    _handleClick(tab, tabHeader, index) {
        if (!tab.disabled) {
            this.selectedIndex = tabHeader.focusIndex = index;
        }
    }
    /** Retrieves the tabindex for the tab. */
    _getTabIndex(tab, index) {
        if (tab.disabled) {
            return null;
        }
        const targetIndex = this._lastFocusedTabIndex ?? this.selectedIndex;
        return index === targetIndex ? 0 : -1;
    }
    /** Callback for when the focused state of a tab has changed. */
    _tabFocusChanged(focusOrigin, index) {
        // Mouse/touch focus happens during the `mousedown`/`touchstart` phase which
        // can cause the tab to be moved out from under the pointer, interrupting the
        // click sequence (see #21898). We don't need to scroll the tab into view for
        // such cases anyway, because it will be done when the tab becomes selected.
        if (focusOrigin && focusOrigin !== 'mouse' && focusOrigin !== 'touch') {
            this._tabHeader.focusIndex = index;
        }
    }
}
_MatTabGroupBase.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.0", ngImport: i0, type: _MatTabGroupBase, deps: [{ token: i0.ElementRef }, { token: i0.ChangeDetectorRef }, { token: MAT_TABS_CONFIG, optional: true }, { token: ANIMATION_MODULE_TYPE, optional: true }], target: i0.ɵɵFactoryTarget.Directive });
_MatTabGroupBase.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "15.0.0", type: _MatTabGroupBase, inputs: { dynamicHeight: "dynamicHeight", selectedIndex: "selectedIndex", headerPosition: "headerPosition", animationDuration: "animationDuration", contentTabIndex: "contentTabIndex", disablePagination: "disablePagination", preserveContent: "preserveContent", backgroundColor: "backgroundColor" }, outputs: { selectedIndexChange: "selectedIndexChange", focusChange: "focusChange", animationDone: "animationDone", selectedTabChange: "selectedTabChange" }, usesInheritance: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.0", ngImport: i0, type: _MatTabGroupBase, decorators: [{
            type: Directive
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.ChangeDetectorRef }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [MAT_TABS_CONFIG]
                }, {
                    type: Optional
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [ANIMATION_MODULE_TYPE]
                }] }]; }, propDecorators: { dynamicHeight: [{
                type: Input
            }], selectedIndex: [{
                type: Input
            }], headerPosition: [{
                type: Input
            }], animationDuration: [{
                type: Input
            }], contentTabIndex: [{
                type: Input
            }], disablePagination: [{
                type: Input
            }], preserveContent: [{
                type: Input
            }], backgroundColor: [{
                type: Input
            }], selectedIndexChange: [{
                type: Output
            }], focusChange: [{
                type: Output
            }], animationDone: [{
                type: Output
            }], selectedTabChange: [{
                type: Output
            }] } });
/**
 * Material design tab-group component. Supports basic tab pairs (label + content) and includes
 * animated ink-bar, keyboard navigation, and screen reader.
 * See: https://material.io/design/components/tabs.html
 */
export class MatTabGroup extends _MatTabGroupBase {
    constructor(elementRef, changeDetectorRef, defaultConfig, animationMode) {
        super(elementRef, changeDetectorRef, defaultConfig, animationMode);
        this._fitInkBarToContent = false;
        this._stretchTabs = true;
        this.fitInkBarToContent =
            defaultConfig && defaultConfig.fitInkBarToContent != null
                ? defaultConfig.fitInkBarToContent
                : false;
    }
    /** Whether the ink bar should fit its width to the size of the tab label content. */
    get fitInkBarToContent() {
        return this._fitInkBarToContent;
    }
    set fitInkBarToContent(v) {
        this._fitInkBarToContent = coerceBooleanProperty(v);
        this._changeDetectorRef.markForCheck();
    }
    /** Whether tabs should be stretched to fill the header. */
    get stretchTabs() {
        return this._stretchTabs;
    }
    set stretchTabs(v) {
        this._stretchTabs = coerceBooleanProperty(v);
    }
}
MatTabGroup.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.0", ngImport: i0, type: MatTabGroup, deps: [{ token: i0.ElementRef }, { token: i0.ChangeDetectorRef }, { token: MAT_TABS_CONFIG, optional: true }, { token: ANIMATION_MODULE_TYPE, optional: true }], target: i0.ɵɵFactoryTarget.Component });
MatTabGroup.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.0.0", type: MatTabGroup, selector: "mat-tab-group", inputs: { color: "color", disableRipple: "disableRipple", fitInkBarToContent: "fitInkBarToContent", stretchTabs: ["mat-stretch-tabs", "stretchTabs"] }, host: { properties: { "class.mat-mdc-tab-group-dynamic-height": "dynamicHeight", "class.mat-mdc-tab-group-inverted-header": "headerPosition === \"below\"", "class.mat-mdc-tab-group-stretch-tabs": "stretchTabs" }, classAttribute: "mat-mdc-tab-group" }, providers: [
        {
            provide: MAT_TAB_GROUP,
            useExisting: MatTabGroup,
        },
    ], queries: [{ propertyName: "_allTabs", predicate: MatTab, descendants: true }], viewQueries: [{ propertyName: "_tabBodyWrapper", first: true, predicate: ["tabBodyWrapper"], descendants: true }, { propertyName: "_tabHeader", first: true, predicate: ["tabHeader"], descendants: true }], exportAs: ["matTabGroup"], usesInheritance: true, ngImport: i0, template: "<mat-tab-header #tabHeader\n                [selectedIndex]=\"selectedIndex || 0\"\n                [disableRipple]=\"disableRipple\"\n                (indexFocused)=\"_focusChanged($event)\"\n                (selectFocusedIndex)=\"selectedIndex = $event\">\n\n  <div class=\"mdc-tab mat-mdc-tab mat-mdc-focus-indicator\"\n       #tabNode\n       role=\"tab\"\n       matTabLabelWrapper\n       cdkMonitorElementFocus\n       *ngFor=\"let tab of _tabs; let i = index\"\n       [id]=\"_getTabLabelId(i)\"\n       [attr.tabIndex]=\"_getTabIndex(tab, i)\"\n       [attr.aria-posinset]=\"i + 1\"\n       [attr.aria-setsize]=\"_tabs.length\"\n       [attr.aria-controls]=\"_getTabContentId(i)\"\n       [attr.aria-selected]=\"selectedIndex === i\"\n       [attr.aria-label]=\"tab.ariaLabel || null\"\n       [attr.aria-labelledby]=\"(!tab.ariaLabel && tab.ariaLabelledby) ? tab.ariaLabelledby : null\"\n       [class.mdc-tab--active]=\"selectedIndex === i\"\n       [ngClass]=\"tab.labelClass\"\n       [disabled]=\"tab.disabled\"\n       [fitInkBarToContent]=\"fitInkBarToContent\"\n       (click)=\"_handleClick(tab, tabHeader, i)\"\n       (cdkFocusChange)=\"_tabFocusChanged($event, i)\">\n    <span class=\"mdc-tab__ripple\"></span>\n\n    <!-- Needs to be a separate element, because we can't put\n         `overflow: hidden` on tab due to the ink bar. -->\n    <div\n      class=\"mat-mdc-tab-ripple\"\n      mat-ripple\n      [matRippleTrigger]=\"tabNode\"\n      [matRippleDisabled]=\"tab.disabled || disableRipple\"></div>\n\n    <span class=\"mdc-tab__content\">\n      <span class=\"mdc-tab__text-label\">\n        <!-- If there is a label template, use it. -->\n        <ng-template [ngIf]=\"tab.templateLabel\" [ngIfElse]=\"tabTextLabel\">\n          <ng-template [cdkPortalOutlet]=\"tab.templateLabel\"></ng-template>\n        </ng-template>\n\n        <!-- If there is not a label template, fall back to the text label. -->\n        <ng-template #tabTextLabel>{{tab.textLabel}}</ng-template>\n      </span>\n    </span>\n  </div>\n</mat-tab-header>\n\n<div\n  class=\"mat-mdc-tab-body-wrapper\"\n  [class._mat-animation-noopable]=\"_animationMode === 'NoopAnimations'\"\n  #tabBodyWrapper>\n  <mat-tab-body role=\"tabpanel\"\n               *ngFor=\"let tab of _tabs; let i = index\"\n               [id]=\"_getTabContentId(i)\"\n               [attr.tabindex]=\"(contentTabIndex != null && selectedIndex === i) ? contentTabIndex : null\"\n               [attr.aria-labelledby]=\"_getTabLabelId(i)\"\n               [class.mat-mdc-tab-body-active]=\"selectedIndex === i\"\n               [ngClass]=\"tab.bodyClass\"\n               [content]=\"tab.content!\"\n               [position]=\"tab.position!\"\n               [origin]=\"tab.origin\"\n               [animationDuration]=\"animationDuration\"\n               [preserveContent]=\"preserveContent\"\n               (_onCentered)=\"_removeTabBodyWrapperHeight()\"\n               (_onCentering)=\"_setTabBodyWrapperHeight($event)\">\n  </mat-tab-body>\n</div>\n", styles: [".mdc-tab{min-width:90px;padding-right:24px;padding-left:24px;display:flex;flex:1 0 auto;justify-content:center;box-sizing:border-box;margin:0;padding-top:0;padding-bottom:0;border:none;outline:none;text-align:center;white-space:nowrap;cursor:pointer;-webkit-appearance:none;z-index:1}.mdc-tab::-moz-focus-inner{padding:0;border:0}.mdc-tab[hidden]{display:none}.mdc-tab--min-width{flex:0 1 auto}.mdc-tab__content{display:flex;align-items:center;justify-content:center;height:inherit;pointer-events:none}.mdc-tab__text-label{transition:150ms color linear;display:inline-block;line-height:1;z-index:2}.mdc-tab__icon{transition:150ms color linear;z-index:2}.mdc-tab--stacked .mdc-tab__content{flex-direction:column;align-items:center;justify-content:center}.mdc-tab--stacked .mdc-tab__text-label{padding-top:6px;padding-bottom:4px}.mdc-tab--active .mdc-tab__text-label,.mdc-tab--active .mdc-tab__icon{transition-delay:100ms}.mdc-tab:not(.mdc-tab--stacked) .mdc-tab__icon+.mdc-tab__text-label{padding-left:8px;padding-right:0}[dir=rtl] .mdc-tab:not(.mdc-tab--stacked) .mdc-tab__icon+.mdc-tab__text-label,.mdc-tab:not(.mdc-tab--stacked) .mdc-tab__icon+.mdc-tab__text-label[dir=rtl]{padding-left:0;padding-right:8px}.mdc-tab-indicator .mdc-tab-indicator__content--underline{border-top-width:2px}.mdc-tab-indicator .mdc-tab-indicator__content--icon{height:34px;font-size:34px}.mdc-tab-indicator{display:flex;position:absolute;top:0;left:0;justify-content:center;width:100%;height:100%;pointer-events:none;z-index:1}.mdc-tab-indicator__content{transform-origin:left;opacity:0}.mdc-tab-indicator__content--underline{align-self:flex-end;box-sizing:border-box;width:100%;border-top-style:solid}.mdc-tab-indicator__content--icon{align-self:center;margin:0 auto}.mdc-tab-indicator--active .mdc-tab-indicator__content{opacity:1}.mdc-tab-indicator .mdc-tab-indicator__content{transition:250ms transform cubic-bezier(0.4, 0, 0.2, 1)}.mdc-tab-indicator--no-transition .mdc-tab-indicator__content{transition:none}.mdc-tab-indicator--fade .mdc-tab-indicator__content{transition:150ms opacity linear}.mdc-tab-indicator--active.mdc-tab-indicator--fade .mdc-tab-indicator__content{transition-delay:100ms}.mat-mdc-tab-ripple{position:absolute;top:0;left:0;bottom:0;right:0;pointer-events:none}.mat-mdc-tab{-webkit-tap-highlight-color:rgba(0,0,0,0)}.mat-mdc-tab.mdc-tab{height:48px;flex-grow:0}.mat-mdc-tab .mdc-tab__ripple::before{content:\"\";display:block;position:absolute;top:0;left:0;right:0;bottom:0;opacity:0;pointer-events:none}.mat-mdc-tab .mdc-tab__text-label{display:inline-flex;align-items:center}.mat-mdc-tab .mdc-tab__content{position:relative}.mat-mdc-tab:hover .mdc-tab__ripple::before{opacity:.04}.mat-mdc-tab.cdk-program-focused .mdc-tab__ripple::before,.mat-mdc-tab.cdk-keyboard-focused .mdc-tab__ripple::before{opacity:.12}.mat-mdc-tab .mat-ripple-element{opacity:.12}.mat-mdc-tab-group.mat-mdc-tab-group-stretch-tabs>.mat-mdc-tab-header .mat-mdc-tab{flex-grow:1}.mat-mdc-tab-disabled{opacity:.4;pointer-events:none}.mat-mdc-tab-group{display:flex;flex-direction:column;max-width:100%}.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header,.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header-pagination{background-color:var(--mat-mdc-tab-header-with-background-background-color, transparent)}.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header .mat-mdc-tab .mdc-tab__text-label,.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header .mat-mdc-tab-link .mdc-tab__text-label{color:var(--mat-mdc-tab-header-with-background-foreground-color, inherit)}.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header .mdc-tab-indicator__content--underline,.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header .mat-mdc-tab-header-pagination-chevron,.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header .mat-mdc-focus-indicator::before{border-color:var(--mat-mdc-tab-header-with-background-foreground-color, inherit)}.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header .mat-ripple-element,.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header .mdc-tab__ripple::before,.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header-pagination .mat-ripple-element,.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header-pagination .mdc-tab__ripple::before{background-color:var(--mat-mdc-tab-header-with-background-foreground-color, inherit)}.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header .mat-mdc-tab-header-pagination-chevron,.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header-pagination .mat-mdc-tab-header-pagination-chevron{border-color:var(--mat-mdc-tab-header-with-background-foreground-color, inherit)}.mat-mdc-tab-group.mat-mdc-tab-group-inverted-header{flex-direction:column-reverse}.mat-mdc-tab-group.mat-mdc-tab-group-inverted-header .mdc-tab-indicator__content--underline{align-self:flex-start}.mat-mdc-tab-body-wrapper{position:relative;overflow:hidden;display:flex;transition:height 500ms cubic-bezier(0.35, 0, 0.25, 1)}.mat-mdc-tab-body-wrapper._mat-animation-noopable{transition:none !important;animation:none !important}"], dependencies: [{ kind: "directive", type: i1.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { kind: "directive", type: i1.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i1.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i2.CdkPortalOutlet, selector: "[cdkPortalOutlet]", inputs: ["cdkPortalOutlet"], outputs: ["attached"], exportAs: ["cdkPortalOutlet"] }, { kind: "directive", type: i3.MatRipple, selector: "[mat-ripple], [matRipple]", inputs: ["matRippleColor", "matRippleUnbounded", "matRippleCentered", "matRippleRadius", "matRippleAnimation", "matRippleDisabled", "matRippleTrigger"], exportAs: ["matRipple"] }, { kind: "directive", type: i4.CdkMonitorFocus, selector: "[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]", outputs: ["cdkFocusChange"], exportAs: ["cdkMonitorFocus"] }, { kind: "component", type: i5.MatTabBody, selector: "mat-tab-body" }, { kind: "directive", type: i6.MatTabLabelWrapper, selector: "[matTabLabelWrapper]", inputs: ["disabled", "fitInkBarToContent"] }, { kind: "component", type: i7.MatTabHeader, selector: "mat-tab-header", inputs: ["selectedIndex"], outputs: ["selectFocusedIndex", "indexFocused"] }], changeDetection: i0.ChangeDetectionStrategy.Default, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.0", ngImport: i0, type: MatTabGroup, decorators: [{
            type: Component,
            args: [{ selector: 'mat-tab-group', exportAs: 'matTabGroup', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.Default, inputs: ['color', 'disableRipple'], providers: [
                        {
                            provide: MAT_TAB_GROUP,
                            useExisting: MatTabGroup,
                        },
                    ], host: {
                        'class': 'mat-mdc-tab-group',
                        '[class.mat-mdc-tab-group-dynamic-height]': 'dynamicHeight',
                        '[class.mat-mdc-tab-group-inverted-header]': 'headerPosition === "below"',
                        '[class.mat-mdc-tab-group-stretch-tabs]': 'stretchTabs',
                    }, template: "<mat-tab-header #tabHeader\n                [selectedIndex]=\"selectedIndex || 0\"\n                [disableRipple]=\"disableRipple\"\n                (indexFocused)=\"_focusChanged($event)\"\n                (selectFocusedIndex)=\"selectedIndex = $event\">\n\n  <div class=\"mdc-tab mat-mdc-tab mat-mdc-focus-indicator\"\n       #tabNode\n       role=\"tab\"\n       matTabLabelWrapper\n       cdkMonitorElementFocus\n       *ngFor=\"let tab of _tabs; let i = index\"\n       [id]=\"_getTabLabelId(i)\"\n       [attr.tabIndex]=\"_getTabIndex(tab, i)\"\n       [attr.aria-posinset]=\"i + 1\"\n       [attr.aria-setsize]=\"_tabs.length\"\n       [attr.aria-controls]=\"_getTabContentId(i)\"\n       [attr.aria-selected]=\"selectedIndex === i\"\n       [attr.aria-label]=\"tab.ariaLabel || null\"\n       [attr.aria-labelledby]=\"(!tab.ariaLabel && tab.ariaLabelledby) ? tab.ariaLabelledby : null\"\n       [class.mdc-tab--active]=\"selectedIndex === i\"\n       [ngClass]=\"tab.labelClass\"\n       [disabled]=\"tab.disabled\"\n       [fitInkBarToContent]=\"fitInkBarToContent\"\n       (click)=\"_handleClick(tab, tabHeader, i)\"\n       (cdkFocusChange)=\"_tabFocusChanged($event, i)\">\n    <span class=\"mdc-tab__ripple\"></span>\n\n    <!-- Needs to be a separate element, because we can't put\n         `overflow: hidden` on tab due to the ink bar. -->\n    <div\n      class=\"mat-mdc-tab-ripple\"\n      mat-ripple\n      [matRippleTrigger]=\"tabNode\"\n      [matRippleDisabled]=\"tab.disabled || disableRipple\"></div>\n\n    <span class=\"mdc-tab__content\">\n      <span class=\"mdc-tab__text-label\">\n        <!-- If there is a label template, use it. -->\n        <ng-template [ngIf]=\"tab.templateLabel\" [ngIfElse]=\"tabTextLabel\">\n          <ng-template [cdkPortalOutlet]=\"tab.templateLabel\"></ng-template>\n        </ng-template>\n\n        <!-- If there is not a label template, fall back to the text label. -->\n        <ng-template #tabTextLabel>{{tab.textLabel}}</ng-template>\n      </span>\n    </span>\n  </div>\n</mat-tab-header>\n\n<div\n  class=\"mat-mdc-tab-body-wrapper\"\n  [class._mat-animation-noopable]=\"_animationMode === 'NoopAnimations'\"\n  #tabBodyWrapper>\n  <mat-tab-body role=\"tabpanel\"\n               *ngFor=\"let tab of _tabs; let i = index\"\n               [id]=\"_getTabContentId(i)\"\n               [attr.tabindex]=\"(contentTabIndex != null && selectedIndex === i) ? contentTabIndex : null\"\n               [attr.aria-labelledby]=\"_getTabLabelId(i)\"\n               [class.mat-mdc-tab-body-active]=\"selectedIndex === i\"\n               [ngClass]=\"tab.bodyClass\"\n               [content]=\"tab.content!\"\n               [position]=\"tab.position!\"\n               [origin]=\"tab.origin\"\n               [animationDuration]=\"animationDuration\"\n               [preserveContent]=\"preserveContent\"\n               (_onCentered)=\"_removeTabBodyWrapperHeight()\"\n               (_onCentering)=\"_setTabBodyWrapperHeight($event)\">\n  </mat-tab-body>\n</div>\n", styles: [".mdc-tab{min-width:90px;padding-right:24px;padding-left:24px;display:flex;flex:1 0 auto;justify-content:center;box-sizing:border-box;margin:0;padding-top:0;padding-bottom:0;border:none;outline:none;text-align:center;white-space:nowrap;cursor:pointer;-webkit-appearance:none;z-index:1}.mdc-tab::-moz-focus-inner{padding:0;border:0}.mdc-tab[hidden]{display:none}.mdc-tab--min-width{flex:0 1 auto}.mdc-tab__content{display:flex;align-items:center;justify-content:center;height:inherit;pointer-events:none}.mdc-tab__text-label{transition:150ms color linear;display:inline-block;line-height:1;z-index:2}.mdc-tab__icon{transition:150ms color linear;z-index:2}.mdc-tab--stacked .mdc-tab__content{flex-direction:column;align-items:center;justify-content:center}.mdc-tab--stacked .mdc-tab__text-label{padding-top:6px;padding-bottom:4px}.mdc-tab--active .mdc-tab__text-label,.mdc-tab--active .mdc-tab__icon{transition-delay:100ms}.mdc-tab:not(.mdc-tab--stacked) .mdc-tab__icon+.mdc-tab__text-label{padding-left:8px;padding-right:0}[dir=rtl] .mdc-tab:not(.mdc-tab--stacked) .mdc-tab__icon+.mdc-tab__text-label,.mdc-tab:not(.mdc-tab--stacked) .mdc-tab__icon+.mdc-tab__text-label[dir=rtl]{padding-left:0;padding-right:8px}.mdc-tab-indicator .mdc-tab-indicator__content--underline{border-top-width:2px}.mdc-tab-indicator .mdc-tab-indicator__content--icon{height:34px;font-size:34px}.mdc-tab-indicator{display:flex;position:absolute;top:0;left:0;justify-content:center;width:100%;height:100%;pointer-events:none;z-index:1}.mdc-tab-indicator__content{transform-origin:left;opacity:0}.mdc-tab-indicator__content--underline{align-self:flex-end;box-sizing:border-box;width:100%;border-top-style:solid}.mdc-tab-indicator__content--icon{align-self:center;margin:0 auto}.mdc-tab-indicator--active .mdc-tab-indicator__content{opacity:1}.mdc-tab-indicator .mdc-tab-indicator__content{transition:250ms transform cubic-bezier(0.4, 0, 0.2, 1)}.mdc-tab-indicator--no-transition .mdc-tab-indicator__content{transition:none}.mdc-tab-indicator--fade .mdc-tab-indicator__content{transition:150ms opacity linear}.mdc-tab-indicator--active.mdc-tab-indicator--fade .mdc-tab-indicator__content{transition-delay:100ms}.mat-mdc-tab-ripple{position:absolute;top:0;left:0;bottom:0;right:0;pointer-events:none}.mat-mdc-tab{-webkit-tap-highlight-color:rgba(0,0,0,0)}.mat-mdc-tab.mdc-tab{height:48px;flex-grow:0}.mat-mdc-tab .mdc-tab__ripple::before{content:\"\";display:block;position:absolute;top:0;left:0;right:0;bottom:0;opacity:0;pointer-events:none}.mat-mdc-tab .mdc-tab__text-label{display:inline-flex;align-items:center}.mat-mdc-tab .mdc-tab__content{position:relative}.mat-mdc-tab:hover .mdc-tab__ripple::before{opacity:.04}.mat-mdc-tab.cdk-program-focused .mdc-tab__ripple::before,.mat-mdc-tab.cdk-keyboard-focused .mdc-tab__ripple::before{opacity:.12}.mat-mdc-tab .mat-ripple-element{opacity:.12}.mat-mdc-tab-group.mat-mdc-tab-group-stretch-tabs>.mat-mdc-tab-header .mat-mdc-tab{flex-grow:1}.mat-mdc-tab-disabled{opacity:.4;pointer-events:none}.mat-mdc-tab-group{display:flex;flex-direction:column;max-width:100%}.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header,.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header-pagination{background-color:var(--mat-mdc-tab-header-with-background-background-color, transparent)}.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header .mat-mdc-tab .mdc-tab__text-label,.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header .mat-mdc-tab-link .mdc-tab__text-label{color:var(--mat-mdc-tab-header-with-background-foreground-color, inherit)}.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header .mdc-tab-indicator__content--underline,.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header .mat-mdc-tab-header-pagination-chevron,.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header .mat-mdc-focus-indicator::before{border-color:var(--mat-mdc-tab-header-with-background-foreground-color, inherit)}.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header .mat-ripple-element,.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header .mdc-tab__ripple::before,.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header-pagination .mat-ripple-element,.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header-pagination .mdc-tab__ripple::before{background-color:var(--mat-mdc-tab-header-with-background-foreground-color, inherit)}.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header .mat-mdc-tab-header-pagination-chevron,.mat-mdc-tab-group.mat-tabs-with-background>.mat-mdc-tab-header-pagination .mat-mdc-tab-header-pagination-chevron{border-color:var(--mat-mdc-tab-header-with-background-foreground-color, inherit)}.mat-mdc-tab-group.mat-mdc-tab-group-inverted-header{flex-direction:column-reverse}.mat-mdc-tab-group.mat-mdc-tab-group-inverted-header .mdc-tab-indicator__content--underline{align-self:flex-start}.mat-mdc-tab-body-wrapper{position:relative;overflow:hidden;display:flex;transition:height 500ms cubic-bezier(0.35, 0, 0.25, 1)}.mat-mdc-tab-body-wrapper._mat-animation-noopable{transition:none !important;animation:none !important}"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.ChangeDetectorRef }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [MAT_TABS_CONFIG]
                }, {
                    type: Optional
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [ANIMATION_MODULE_TYPE]
                }] }]; }, propDecorators: { _allTabs: [{
                type: ContentChildren,
                args: [MatTab, { descendants: true }]
            }], _tabBodyWrapper: [{
                type: ViewChild,
                args: ['tabBodyWrapper']
            }], _tabHeader: [{
                type: ViewChild,
                args: ['tabHeader']
            }], fitInkBarToContent: [{
                type: Input
            }], stretchTabs: [{
                type: Input,
                args: ['mat-stretch-tabs']
            }] } });
/** A simple change event emitted on focus or selection changes. */
export class MatTabChangeEvent {
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFiLWdyb3VwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21hdGVyaWFsL3RhYnMvdGFiLWdyb3VwLnRzIiwiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21hdGVyaWFsL3RhYnMvdGFiLWdyb3VwLmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUdMLHVCQUF1QixFQUN2QixpQkFBaUIsRUFDakIsU0FBUyxFQUNULGVBQWUsRUFDZixTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixNQUFNLEVBQ04sS0FBSyxFQUVMLFFBQVEsRUFDUixNQUFNLEVBQ04sU0FBUyxFQUNULFNBQVMsRUFDVCxpQkFBaUIsR0FDbEIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDM0UsT0FBTyxFQUFDLGFBQWEsRUFBRSxNQUFNLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDNUMsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUMxQyxPQUFPLEVBRUwscUJBQXFCLEVBQ3JCLG9CQUFvQixHQUVyQixNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sRUFHTCxVQUFVLEVBQ1Ysa0JBQWtCLEdBRW5CLE1BQU0sd0JBQXdCLENBQUM7QUFDaEMsT0FBTyxFQUFDLEtBQUssRUFBRSxZQUFZLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDekMsT0FBTyxFQUFDLGVBQWUsRUFBZ0IsTUFBTSxjQUFjLENBQUM7QUFDNUQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGdCQUFnQixDQUFDOzs7Ozs7Ozs7QUFHekMsMERBQTBEO0FBQzFELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztBQUVmLGtEQUFrRDtBQUNsRCxvQkFBb0I7QUFDcEIsTUFBTSxxQkFBcUIsR0FBRyxVQUFVLENBQ3RDLGtCQUFrQixDQUNoQjtJQUNF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Q0FBQyxDQUFDLENBQUM7SUFDL0MsQ0FBQzs7d0dBdkJVLFdBQVcsNkVBNkJaLGVBQWUsNkJBQ0gscUJBQXFCOzRGQTlCaEMsV0FBVyw0YkFiWDtRQUNUO1lBQ0UsT0FBTyxFQUFFLGFBQWE7WUFDdEIsV0FBVyxFQUFFLFdBQVc7U0FDekI7S0FDRixtREFTZ0IsTUFBTSwrU0NyaEJ6QixzOUZBc0VBOzJGRDhjYSxXQUFXO2tCQXRCdkIsU0FBUzsrQkFDRSxlQUFlLFlBQ2YsYUFBYSxpQkFHUixpQkFBaUIsQ0FBQyxJQUFJLG1CQUVwQix1QkFBdUIsQ0FBQyxPQUFPLFVBQ3hDLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxhQUN2Qjt3QkFDVDs0QkFDRSxPQUFPLEVBQUUsYUFBYTs0QkFDdEIsV0FBVyxhQUFhO3lCQUN6QjtxQkFDRixRQUNLO3dCQUNKLE9BQU8sRUFBRSxtQkFBbUI7d0JBQzVCLDBDQUEwQyxFQUFFLGVBQWU7d0JBQzNELDJDQUEyQyxFQUFFLDRCQUE0Qjt3QkFDekUsd0NBQXdDLEVBQUUsYUFBYTtxQkFDeEQ7OzBCQStCRSxNQUFNOzJCQUFDLGVBQWU7OzBCQUFHLFFBQVE7OzBCQUNqQyxRQUFROzswQkFBSSxNQUFNOzJCQUFDLHFCQUFxQjs0Q0E3QkcsUUFBUTtzQkFBckQsZUFBZTt1QkFBQyxNQUFNLEVBQUUsRUFBQyxXQUFXLEVBQUUsSUFBSSxFQUFDO2dCQUNmLGVBQWU7c0JBQTNDLFNBQVM7dUJBQUMsZ0JBQWdCO2dCQUNILFVBQVU7c0JBQWpDLFNBQVM7dUJBQUMsV0FBVztnQkFJbEIsa0JBQWtCO3NCQURyQixLQUFLO2dCQVlGLFdBQVc7c0JBRGQsS0FBSzt1QkFBQyxrQkFBa0I7O0FBdUIzQixtRUFBbUU7QUFDbkUsTUFBTSxPQUFPLGlCQUFpQjtDQUs3QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBBZnRlckNvbnRlbnRDaGVja2VkLFxuICBBZnRlckNvbnRlbnRJbml0LFxuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgQ29udGVudENoaWxkcmVuLFxuICBEaXJlY3RpdmUsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5qZWN0LFxuICBJbnB1dCxcbiAgT25EZXN0cm95LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBRdWVyeUxpc3QsXG4gIFZpZXdDaGlsZCxcbiAgVmlld0VuY2Fwc3VsYXRpb24sXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtBTklNQVRJT05fTU9EVUxFX1RZUEV9IGZyb20gJ0Bhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXIvYW5pbWF0aW9ucyc7XG5pbXBvcnQge01BVF9UQUJfR1JPVVAsIE1hdFRhYn0gZnJvbSAnLi90YWInO1xuaW1wb3J0IHtNYXRUYWJIZWFkZXJ9IGZyb20gJy4vdGFiLWhlYWRlcic7XG5pbXBvcnQge1xuICBCb29sZWFuSW5wdXQsXG4gIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSxcbiAgY29lcmNlTnVtYmVyUHJvcGVydHksXG4gIE51bWJlcklucHV0LFxufSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtcbiAgQ2FuQ29sb3IsXG4gIENhbkRpc2FibGVSaXBwbGUsXG4gIG1peGluQ29sb3IsXG4gIG1peGluRGlzYWJsZVJpcHBsZSxcbiAgVGhlbWVQYWxldHRlLFxufSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbC9jb3JlJztcbmltcG9ydCB7bWVyZ2UsIFN1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge01BVF9UQUJTX0NPTkZJRywgTWF0VGFic0NvbmZpZ30gZnJvbSAnLi90YWItY29uZmlnJztcbmltcG9ydCB7c3RhcnRXaXRofSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge0ZvY3VzT3JpZ2lufSBmcm9tICdAYW5ndWxhci9jZGsvYTExeSc7XG5cbi8qKiBVc2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBJRCdzIGZvciBlYWNoIHRhYiBjb21wb25lbnQgKi9cbmxldCBuZXh0SWQgPSAwO1xuXG4vLyBCb2lsZXJwbGF0ZSBmb3IgYXBwbHlpbmcgbWl4aW5zIHRvIE1hdFRhYkdyb3VwLlxuLyoqIEBkb2NzLXByaXZhdGUgKi9cbmNvbnN0IF9NYXRUYWJHcm91cE1peGluQmFzZSA9IG1peGluQ29sb3IoXG4gIG1peGluRGlzYWJsZVJpcHBsZShcbiAgICBjbGFzcyB7XG4gICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHt9XG4gICAgfSxcbiAgKSxcbiAgJ3ByaW1hcnknLFxuKTtcblxuLyoqIEBkb2NzLXByaXZhdGUgKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWF0VGFiR3JvdXBCYXNlSGVhZGVyIHtcbiAgX2FsaWduSW5rQmFyVG9TZWxlY3RlZFRhYigpOiB2b2lkO1xuICB1cGRhdGVQYWdpbmF0aW9uKCk6IHZvaWQ7XG4gIGZvY3VzSW5kZXg6IG51bWJlcjtcbn1cblxuLyoqIFBvc3NpYmxlIHBvc2l0aW9ucyBmb3IgdGhlIHRhYiBoZWFkZXIuICovXG5leHBvcnQgdHlwZSBNYXRUYWJIZWFkZXJQb3NpdGlvbiA9ICdhYm92ZScgfCAnYmVsb3cnO1xuXG4vKipcbiAqIEJhc2UgY2xhc3Mgd2l0aCBhbGwgb2YgdGhlIGBNYXRUYWJHcm91cEJhc2VgIGZ1bmN0aW9uYWxpdHkuXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbkBEaXJlY3RpdmUoKVxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIF9NYXRUYWJHcm91cEJhc2VcbiAgZXh0ZW5kcyBfTWF0VGFiR3JvdXBNaXhpbkJhc2VcbiAgaW1wbGVtZW50cyBBZnRlckNvbnRlbnRJbml0LCBBZnRlckNvbnRlbnRDaGVja2VkLCBPbkRlc3Ryb3ksIENhbkNvbG9yLCBDYW5EaXNhYmxlUmlwcGxlXG57XG4gIC8qKlxuICAgKiBBbGwgdGFicyBpbnNpZGUgdGhlIHRhYiBncm91cC4gVGhpcyBpbmNsdWRlcyB0YWJzIHRoYXQgYmVsb25nIHRvIGdyb3VwcyB0aGF0IGFyZSBuZXN0ZWRcbiAgICogaW5zaWRlIHRoZSBjdXJyZW50IG9uZS4gV2UgZmlsdGVyIG91dCBvbmx5IHRoZSB0YWJzIHRoYXQgYmVsb25nIHRvIHRoaXMgZ3JvdXAgaW4gYF90YWJzYC5cbiAgICovXG4gIGFic3RyYWN0IF9hbGxUYWJzOiBRdWVyeUxpc3Q8TWF0VGFiPjtcbiAgYWJzdHJhY3QgX3RhYkJvZHlXcmFwcGVyOiBFbGVtZW50UmVmO1xuICBhYnN0cmFjdCBfdGFiSGVhZGVyOiBNYXRUYWJHcm91cEJhc2VIZWFkZXI7XG5cbiAgLyoqIEFsbCBvZiB0aGUgdGFicyB0aGF0IGJlbG9uZyB0byB0aGUgZ3JvdXAuICovXG4gIF90YWJzOiBRdWVyeUxpc3Q8TWF0VGFiPiA9IG5ldyBRdWVyeUxpc3Q8TWF0VGFiPigpO1xuXG4gIC8qKiBUaGUgdGFiIGluZGV4IHRoYXQgc2hvdWxkIGJlIHNlbGVjdGVkIGFmdGVyIHRoZSBjb250ZW50IGhhcyBiZWVuIGNoZWNrZWQuICovXG4gIHByaXZhdGUgX2luZGV4VG9TZWxlY3Q6IG51bWJlciB8IG51bGwgPSAwO1xuXG4gIC8qKiBJbmRleCBvZiB0aGUgdGFiIHRoYXQgd2FzIGZvY3VzZWQgbGFzdC4gKi9cbiAgcHJpdmF0ZSBfbGFzdEZvY3VzZWRUYWJJbmRleDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqIFNuYXBzaG90IG9mIHRoZSBoZWlnaHQgb2YgdGhlIHRhYiBib2R5IHdyYXBwZXIgYmVmb3JlIGFub3RoZXIgdGFiIGlzIGFjdGl2YXRlZC4gKi9cbiAgcHJpdmF0ZSBfdGFiQm9keVdyYXBwZXJIZWlnaHQ6IG51bWJlciA9IDA7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byB0YWJzIGJlaW5nIGFkZGVkL3JlbW92ZWQuICovXG4gIHByaXZhdGUgX3RhYnNTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqIFN1YnNjcmlwdGlvbiB0byBjaGFuZ2VzIGluIHRoZSB0YWIgbGFiZWxzLiAqL1xuICBwcml2YXRlIF90YWJMYWJlbFN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbi5FTVBUWTtcblxuICAvKiogV2hldGhlciB0aGUgdGFiIGdyb3VwIHNob3VsZCBncm93IHRvIHRoZSBzaXplIG9mIHRoZSBhY3RpdmUgdGFiLiAqL1xuICBASW5wdXQoKVxuICBnZXQgZHluYW1pY0hlaWdodCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZHluYW1pY0hlaWdodDtcbiAgfVxuXG4gIHNldCBkeW5hbWljSGVpZ2h0KHZhbHVlOiBCb29sZWFuSW5wdXQpIHtcbiAgICB0aGlzLl9keW5hbWljSGVpZ2h0ID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuXG4gIHByaXZhdGUgX2R5bmFtaWNIZWlnaHQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogVGhlIGluZGV4IG9mIHRoZSBhY3RpdmUgdGFiLiAqL1xuICBASW5wdXQoKVxuICBnZXQgc2VsZWN0ZWRJbmRleCgpOiBudW1iZXIgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5fc2VsZWN0ZWRJbmRleDtcbiAgfVxuXG4gIHNldCBzZWxlY3RlZEluZGV4KHZhbHVlOiBOdW1iZXJJbnB1dCkge1xuICAgIHRoaXMuX2luZGV4VG9TZWxlY3QgPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eSh2YWx1ZSwgbnVsbCk7XG4gIH1cblxuICBwcml2YXRlIF9zZWxlY3RlZEluZGV4OiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICAvKiogUG9zaXRpb24gb2YgdGhlIHRhYiBoZWFkZXIuICovXG4gIEBJbnB1dCgpIGhlYWRlclBvc2l0aW9uOiBNYXRUYWJIZWFkZXJQb3NpdGlvbiA9ICdhYm92ZSc7XG5cbiAgLyoqIER1cmF0aW9uIGZvciB0aGUgdGFiIGFuaW1hdGlvbi4gV2lsbCBiZSBub3JtYWxpemVkIHRvIG1pbGxpc2Vjb25kcyBpZiBubyB1bml0cyBhcmUgc2V0LiAqL1xuICBASW5wdXQoKVxuICBnZXQgYW5pbWF0aW9uRHVyYXRpb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fYW5pbWF0aW9uRHVyYXRpb247XG4gIH1cblxuICBzZXQgYW5pbWF0aW9uRHVyYXRpb24odmFsdWU6IE51bWJlcklucHV0KSB7XG4gICAgdGhpcy5fYW5pbWF0aW9uRHVyYXRpb24gPSAvXlxcZCskLy50ZXN0KHZhbHVlICsgJycpID8gdmFsdWUgKyAnbXMnIDogKHZhbHVlIGFzIHN0cmluZyk7XG4gIH1cblxuICBwcml2YXRlIF9hbmltYXRpb25EdXJhdGlvbjogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBgdGFiaW5kZXhgIHRvIGJlIHNldCBvbiB0aGUgaW5uZXIgZWxlbWVudCB0aGF0IHdyYXBzIHRoZSB0YWIgY29udGVudC4gQ2FuIGJlIHVzZWQgZm9yIGltcHJvdmVkXG4gICAqIGFjY2Vzc2liaWxpdHkgd2hlbiB0aGUgdGFiIGRvZXMgbm90IGhhdmUgZm9jdXNhYmxlIGVsZW1lbnRzIG9yIGlmIGl0IGhhcyBzY3JvbGxhYmxlIGNvbnRlbnQuXG4gICAqIFRoZSBgdGFiaW5kZXhgIHdpbGwgYmUgcmVtb3ZlZCBhdXRvbWF0aWNhbGx5IGZvciBpbmFjdGl2ZSB0YWJzLlxuICAgKiBSZWFkIG1vcmUgYXQgaHR0cHM6Ly93d3cudzMub3JnL1RSL3dhaS1hcmlhLXByYWN0aWNlcy9leGFtcGxlcy90YWJzL3RhYnMtMi90YWJzLmh0bWxcbiAgICovXG4gIEBJbnB1dCgpXG4gIGdldCBjb250ZW50VGFiSW5kZXgoKTogbnVtYmVyIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRlbnRUYWJJbmRleDtcbiAgfVxuXG4gIHNldCBjb250ZW50VGFiSW5kZXgodmFsdWU6IE51bWJlcklucHV0KSB7XG4gICAgdGhpcy5fY29udGVudFRhYkluZGV4ID0gY29lcmNlTnVtYmVyUHJvcGVydHkodmFsdWUsIG51bGwpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY29udGVudFRhYkluZGV4OiBudW1iZXIgfCBudWxsO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHBhZ2luYXRpb24gc2hvdWxkIGJlIGRpc2FibGVkLiBUaGlzIGNhbiBiZSB1c2VkIHRvIGF2b2lkIHVubmVjZXNzYXJ5XG4gICAqIGxheW91dCByZWNhbGN1bGF0aW9ucyBpZiBpdCdzIGtub3duIHRoYXQgcGFnaW5hdGlvbiB3b24ndCBiZSByZXF1aXJlZC5cbiAgICovXG4gIEBJbnB1dCgpXG4gIGdldCBkaXNhYmxlUGFnaW5hdGlvbigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZVBhZ2luYXRpb247XG4gIH1cblxuICBzZXQgZGlzYWJsZVBhZ2luYXRpb24odmFsdWU6IEJvb2xlYW5JbnB1dCkge1xuICAgIHRoaXMuX2Rpc2FibGVQYWdpbmF0aW9uID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuXG4gIHByaXZhdGUgX2Rpc2FibGVQYWdpbmF0aW9uOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEJ5IGRlZmF1bHQgdGFicyByZW1vdmUgdGhlaXIgY29udGVudCBmcm9tIHRoZSBET00gd2hpbGUgaXQncyBvZmYtc2NyZWVuLlxuICAgKiBTZXR0aW5nIHRoaXMgdG8gYHRydWVgIHdpbGwga2VlcCBpdCBpbiB0aGUgRE9NIHdoaWNoIHdpbGwgcHJldmVudCBlbGVtZW50c1xuICAgKiBsaWtlIGlmcmFtZXMgYW5kIHZpZGVvcyBmcm9tIHJlbG9hZGluZyBuZXh0IHRpbWUgaXQgY29tZXMgYmFjayBpbnRvIHRoZSB2aWV3LlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IHByZXNlcnZlQ29udGVudCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fcHJlc2VydmVDb250ZW50O1xuICB9XG5cbiAgc2V0IHByZXNlcnZlQ29udGVudCh2YWx1ZTogQm9vbGVhbklucHV0KSB7XG4gICAgdGhpcy5fcHJlc2VydmVDb250ZW50ID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcbiAgfVxuXG4gIHByaXZhdGUgX3ByZXNlcnZlQ29udGVudDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBCYWNrZ3JvdW5kIGNvbG9yIG9mIHRoZSB0YWIgZ3JvdXAuICovXG4gIEBJbnB1dCgpXG4gIGdldCBiYWNrZ3JvdW5kQ29sb3IoKTogVGhlbWVQYWxldHRlIHtcbiAgICByZXR1cm4gdGhpcy5fYmFja2dyb3VuZENvbG9yO1xuICB9XG5cbiAgc2V0IGJhY2tncm91bmRDb2xvcih2YWx1ZTogVGhlbWVQYWxldHRlKSB7XG4gICAgY29uc3QgY2xhc3NMaXN0OiBET01Ub2tlbkxpc3QgPSB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xhc3NMaXN0O1xuXG4gICAgY2xhc3NMaXN0LnJlbW92ZSgnbWF0LXRhYnMtd2l0aC1iYWNrZ3JvdW5kJywgYG1hdC1iYWNrZ3JvdW5kLSR7dGhpcy5iYWNrZ3JvdW5kQ29sb3J9YCk7XG5cbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIGNsYXNzTGlzdC5hZGQoJ21hdC10YWJzLXdpdGgtYmFja2dyb3VuZCcsIGBtYXQtYmFja2dyb3VuZC0ke3ZhbHVlfWApO1xuICAgIH1cblxuICAgIHRoaXMuX2JhY2tncm91bmRDb2xvciA9IHZhbHVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfYmFja2dyb3VuZENvbG9yOiBUaGVtZVBhbGV0dGU7XG5cbiAgLyoqIE91dHB1dCB0byBlbmFibGUgc3VwcG9ydCBmb3IgdHdvLXdheSBiaW5kaW5nIG9uIGBbKHNlbGVjdGVkSW5kZXgpXWAgKi9cbiAgQE91dHB1dCgpIHJlYWRvbmx5IHNlbGVjdGVkSW5kZXhDaGFuZ2U6IEV2ZW50RW1pdHRlcjxudW1iZXI+ID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KCk7XG5cbiAgLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiBmb2N1cyBoYXMgY2hhbmdlZCB3aXRoaW4gYSB0YWIgZ3JvdXAuICovXG4gIEBPdXRwdXQoKSByZWFkb25seSBmb2N1c0NoYW5nZTogRXZlbnRFbWl0dGVyPE1hdFRhYkNoYW5nZUV2ZW50PiA9XG4gICAgbmV3IEV2ZW50RW1pdHRlcjxNYXRUYWJDaGFuZ2VFdmVudD4oKTtcblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSBib2R5IGFuaW1hdGlvbiBoYXMgY29tcGxldGVkICovXG4gIEBPdXRwdXQoKSByZWFkb25seSBhbmltYXRpb25Eb25lOiBFdmVudEVtaXR0ZXI8dm9pZD4gPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG5cbiAgLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgdGFiIHNlbGVjdGlvbiBoYXMgY2hhbmdlZC4gKi9cbiAgQE91dHB1dCgpIHJlYWRvbmx5IHNlbGVjdGVkVGFiQ2hhbmdlOiBFdmVudEVtaXR0ZXI8TWF0VGFiQ2hhbmdlRXZlbnQ+ID1cbiAgICBuZXcgRXZlbnRFbWl0dGVyPE1hdFRhYkNoYW5nZUV2ZW50Pih0cnVlKTtcblxuICBwcml2YXRlIF9ncm91cElkOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgZWxlbWVudFJlZjogRWxlbWVudFJlZixcbiAgICBwcm90ZWN0ZWQgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBASW5qZWN0KE1BVF9UQUJTX0NPTkZJRykgQE9wdGlvbmFsKCkgZGVmYXVsdENvbmZpZz86IE1hdFRhYnNDb25maWcsXG4gICAgQE9wdGlvbmFsKCkgQEluamVjdChBTklNQVRJT05fTU9EVUxFX1RZUEUpIHB1YmxpYyBfYW5pbWF0aW9uTW9kZT86IHN0cmluZyxcbiAgKSB7XG4gICAgc3VwZXIoZWxlbWVudFJlZik7XG4gICAgdGhpcy5fZ3JvdXBJZCA9IG5leHRJZCsrO1xuICAgIHRoaXMuYW5pbWF0aW9uRHVyYXRpb24gPVxuICAgICAgZGVmYXVsdENvbmZpZyAmJiBkZWZhdWx0Q29uZmlnLmFuaW1hdGlvbkR1cmF0aW9uID8gZGVmYXVsdENvbmZpZy5hbmltYXRpb25EdXJhdGlvbiA6ICc1MDBtcyc7XG4gICAgdGhpcy5kaXNhYmxlUGFnaW5hdGlvbiA9XG4gICAgICBkZWZhdWx0Q29uZmlnICYmIGRlZmF1bHRDb25maWcuZGlzYWJsZVBhZ2luYXRpb24gIT0gbnVsbFxuICAgICAgICA/IGRlZmF1bHRDb25maWcuZGlzYWJsZVBhZ2luYXRpb25cbiAgICAgICAgOiBmYWxzZTtcbiAgICB0aGlzLmR5bmFtaWNIZWlnaHQgPVxuICAgICAgZGVmYXVsdENvbmZpZyAmJiBkZWZhdWx0Q29uZmlnLmR5bmFtaWNIZWlnaHQgIT0gbnVsbCA/IGRlZmF1bHRDb25maWcuZHluYW1pY0hlaWdodCA6IGZhbHNlO1xuICAgIHRoaXMuY29udGVudFRhYkluZGV4ID0gZGVmYXVsdENvbmZpZz8uY29udGVudFRhYkluZGV4ID8/IG51bGw7XG4gICAgdGhpcy5wcmVzZXJ2ZUNvbnRlbnQgPSAhIWRlZmF1bHRDb25maWc/LnByZXNlcnZlQ29udGVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZnRlciB0aGUgY29udGVudCBpcyBjaGVja2VkLCB0aGlzIGNvbXBvbmVudCBrbm93cyB3aGF0IHRhYnMgaGF2ZSBiZWVuIGRlZmluZWRcbiAgICogYW5kIHdoYXQgdGhlIHNlbGVjdGVkIGluZGV4IHNob3VsZCBiZS4gVGhpcyBpcyB3aGVyZSB3ZSBjYW4ga25vdyBleGFjdGx5IHdoYXQgcG9zaXRpb25cbiAgICogZWFjaCB0YWIgc2hvdWxkIGJlIGluIGFjY29yZGluZyB0byB0aGUgbmV3IHNlbGVjdGVkIGluZGV4LCBhbmQgYWRkaXRpb25hbGx5IHdlIGtub3cgaG93XG4gICAqIGEgbmV3IHNlbGVjdGVkIHRhYiBzaG91bGQgdHJhbnNpdGlvbiBpbiAoZnJvbSB0aGUgbGVmdCBvciByaWdodCkuXG4gICAqL1xuICBuZ0FmdGVyQ29udGVudENoZWNrZWQoKSB7XG4gICAgLy8gRG9uJ3QgY2xhbXAgdGhlIGBpbmRleFRvU2VsZWN0YCBpbW1lZGlhdGVseSBpbiB0aGUgc2V0dGVyIGJlY2F1c2UgaXQgY2FuIGhhcHBlbiB0aGF0XG4gICAgLy8gdGhlIGFtb3VudCBvZiB0YWJzIGNoYW5nZXMgYmVmb3JlIHRoZSBhY3R1YWwgY2hhbmdlIGRldGVjdGlvbiBydW5zLlxuICAgIGNvbnN0IGluZGV4VG9TZWxlY3QgPSAodGhpcy5faW5kZXhUb1NlbGVjdCA9IHRoaXMuX2NsYW1wVGFiSW5kZXgodGhpcy5faW5kZXhUb1NlbGVjdCkpO1xuXG4gICAgLy8gSWYgdGhlcmUgaXMgYSBjaGFuZ2UgaW4gc2VsZWN0ZWQgaW5kZXgsIGVtaXQgYSBjaGFuZ2UgZXZlbnQuIFNob3VsZCBub3QgdHJpZ2dlciBpZlxuICAgIC8vIHRoZSBzZWxlY3RlZCBpbmRleCBoYXMgbm90IHlldCBiZWVuIGluaXRpYWxpemVkLlxuICAgIGlmICh0aGlzLl9zZWxlY3RlZEluZGV4ICE9IGluZGV4VG9TZWxlY3QpIHtcbiAgICAgIGNvbnN0IGlzRmlyc3RSdW4gPSB0aGlzLl9zZWxlY3RlZEluZGV4ID09IG51bGw7XG5cbiAgICAgIGlmICghaXNGaXJzdFJ1bikge1xuICAgICAgICB0aGlzLnNlbGVjdGVkVGFiQ2hhbmdlLmVtaXQodGhpcy5fY3JlYXRlQ2hhbmdlRXZlbnQoaW5kZXhUb1NlbGVjdCkpO1xuICAgICAgICAvLyBQcmVzZXJ2ZSB0aGUgaGVpZ2h0IHNvIHBhZ2UgZG9lc24ndCBzY3JvbGwgdXAgZHVyaW5nIHRhYiBjaGFuZ2UuXG4gICAgICAgIC8vIEZpeGVzIGh0dHBzOi8vc3RhY2tibGl0ei5jb20vZWRpdC9tYXQtdGFicy1zY3JvbGwtcGFnZS10b3Atb24tdGFiLWNoYW5nZVxuICAgICAgICBjb25zdCB3cmFwcGVyID0gdGhpcy5fdGFiQm9keVdyYXBwZXIubmF0aXZlRWxlbWVudDtcbiAgICAgICAgd3JhcHBlci5zdHlsZS5taW5IZWlnaHQgPSB3cmFwcGVyLmNsaWVudEhlaWdodCArICdweCc7XG4gICAgICB9XG5cbiAgICAgIC8vIENoYW5naW5nIHRoZXNlIHZhbHVlcyBhZnRlciBjaGFuZ2UgZGV0ZWN0aW9uIGhhcyBydW5cbiAgICAgIC8vIHNpbmNlIHRoZSBjaGVja2VkIGNvbnRlbnQgbWF5IGNvbnRhaW4gcmVmZXJlbmNlcyB0byB0aGVtLlxuICAgICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMuX3RhYnMuZm9yRWFjaCgodGFiLCBpbmRleCkgPT4gKHRhYi5pc0FjdGl2ZSA9IGluZGV4ID09PSBpbmRleFRvU2VsZWN0KSk7XG5cbiAgICAgICAgaWYgKCFpc0ZpcnN0UnVuKSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4Q2hhbmdlLmVtaXQoaW5kZXhUb1NlbGVjdCk7XG4gICAgICAgICAgLy8gQ2xlYXIgdGhlIG1pbi1oZWlnaHQsIHRoaXMgd2FzIG5lZWRlZCBkdXJpbmcgdGFiIGNoYW5nZSB0byBhdm9pZFxuICAgICAgICAgIC8vIHVubmVjZXNzYXJ5IHNjcm9sbGluZy5cbiAgICAgICAgICB0aGlzLl90YWJCb2R5V3JhcHBlci5uYXRpdmVFbGVtZW50LnN0eWxlLm1pbkhlaWdodCA9ICcnO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBTZXR1cCB0aGUgcG9zaXRpb24gZm9yIGVhY2ggdGFiIGFuZCBvcHRpb25hbGx5IHNldHVwIGFuIG9yaWdpbiBvbiB0aGUgbmV4dCBzZWxlY3RlZCB0YWIuXG4gICAgdGhpcy5fdGFicy5mb3JFYWNoKCh0YWI6IE1hdFRhYiwgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgdGFiLnBvc2l0aW9uID0gaW5kZXggLSBpbmRleFRvU2VsZWN0O1xuXG4gICAgICAvLyBJZiB0aGVyZSBpcyBhbHJlYWR5IGEgc2VsZWN0ZWQgdGFiLCB0aGVuIHNldCB1cCBhbiBvcmlnaW4gZm9yIHRoZSBuZXh0IHNlbGVjdGVkIHRhYlxuICAgICAgLy8gaWYgaXQgZG9lc24ndCBoYXZlIG9uZSBhbHJlYWR5LlxuICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkSW5kZXggIT0gbnVsbCAmJiB0YWIucG9zaXRpb24gPT0gMCAmJiAhdGFiLm9yaWdpbikge1xuICAgICAgICB0YWIub3JpZ2luID0gaW5kZXhUb1NlbGVjdCAtIHRoaXMuX3NlbGVjdGVkSW5kZXg7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5fc2VsZWN0ZWRJbmRleCAhPT0gaW5kZXhUb1NlbGVjdCkge1xuICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IGluZGV4VG9TZWxlY3Q7XG4gICAgICB0aGlzLl9sYXN0Rm9jdXNlZFRhYkluZGV4ID0gbnVsbDtcbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH1cbiAgfVxuXG4gIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICB0aGlzLl9zdWJzY3JpYmVUb0FsbFRhYkNoYW5nZXMoKTtcbiAgICB0aGlzLl9zdWJzY3JpYmVUb1RhYkxhYmVscygpO1xuXG4gICAgLy8gU3Vic2NyaWJlIHRvIGNoYW5nZXMgaW4gdGhlIGFtb3VudCBvZiB0YWJzLCBpbiBvcmRlciB0byBiZVxuICAgIC8vIGFibGUgdG8gcmUtcmVuZGVyIHRoZSBjb250ZW50IGFzIG5ldyB0YWJzIGFyZSBhZGRlZCBvciByZW1vdmVkLlxuICAgIHRoaXMuX3RhYnNTdWJzY3JpcHRpb24gPSB0aGlzLl90YWJzLmNoYW5nZXMuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgIGNvbnN0IGluZGV4VG9TZWxlY3QgPSB0aGlzLl9jbGFtcFRhYkluZGV4KHRoaXMuX2luZGV4VG9TZWxlY3QpO1xuXG4gICAgICAvLyBNYWludGFpbiB0aGUgcHJldmlvdXNseS1zZWxlY3RlZCB0YWIgaWYgYSBuZXcgdGFiIGlzIGFkZGVkIG9yIHJlbW92ZWQgYW5kIHRoZXJlIGlzIG5vXG4gICAgICAvLyBleHBsaWNpdCBjaGFuZ2UgdGhhdCBzZWxlY3RzIGEgZGlmZmVyZW50IHRhYi5cbiAgICAgIGlmIChpbmRleFRvU2VsZWN0ID09PSB0aGlzLl9zZWxlY3RlZEluZGV4KSB7XG4gICAgICAgIGNvbnN0IHRhYnMgPSB0aGlzLl90YWJzLnRvQXJyYXkoKTtcbiAgICAgICAgbGV0IHNlbGVjdGVkVGFiOiBNYXRUYWIgfCB1bmRlZmluZWQ7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0YWJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHRhYnNbaV0uaXNBY3RpdmUpIHtcbiAgICAgICAgICAgIC8vIEFzc2lnbiBib3RoIHRvIHRoZSBgX2luZGV4VG9TZWxlY3RgIGFuZCBgX3NlbGVjdGVkSW5kZXhgIHNvIHdlIGRvbid0IGZpcmUgYSBjaGFuZ2VkXG4gICAgICAgICAgICAvLyBldmVudCwgb3RoZXJ3aXNlIHRoZSBjb25zdW1lciBtYXkgZW5kIHVwIGluIGFuIGluZmluaXRlIGxvb3AgaW4gc29tZSBlZGdlIGNhc2VzIGxpa2VcbiAgICAgICAgICAgIC8vIGFkZGluZyBhIHRhYiB3aXRoaW4gdGhlIGBzZWxlY3RlZEluZGV4Q2hhbmdlYCBldmVudC5cbiAgICAgICAgICAgIHRoaXMuX2luZGV4VG9TZWxlY3QgPSB0aGlzLl9zZWxlY3RlZEluZGV4ID0gaTtcbiAgICAgICAgICAgIHRoaXMuX2xhc3RGb2N1c2VkVGFiSW5kZXggPSBudWxsO1xuICAgICAgICAgICAgc2VsZWN0ZWRUYWIgPSB0YWJzW2ldO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgd2UgaGF2ZW4ndCBmb3VuZCBhbiBhY3RpdmUgdGFiIGFuZCBhIHRhYiBleGlzdHMgYXQgdGhlIHNlbGVjdGVkIGluZGV4LCBpdCBtZWFuc1xuICAgICAgICAvLyB0aGF0IHRoZSBhY3RpdmUgdGFiIHdhcyBzd2FwcGVkIG91dC4gU2luY2UgdGhpcyB3b24ndCBiZSBwaWNrZWQgdXAgYnkgdGhlIHJlbmRlcmluZ1xuICAgICAgICAvLyBsb29wIGluIGBuZ0FmdGVyQ29udGVudENoZWNrZWRgLCB3ZSBuZWVkIHRvIHN5bmMgaXQgdXAgbWFudWFsbHkuXG4gICAgICAgIGlmICghc2VsZWN0ZWRUYWIgJiYgdGFic1tpbmRleFRvU2VsZWN0XSkge1xuICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgdGFic1tpbmRleFRvU2VsZWN0XS5pc0FjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkVGFiQ2hhbmdlLmVtaXQodGhpcy5fY3JlYXRlQ2hhbmdlRXZlbnQoaW5kZXhUb1NlbGVjdCkpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIExpc3RlbnMgdG8gY2hhbmdlcyBpbiBhbGwgb2YgdGhlIHRhYnMuICovXG4gIHByaXZhdGUgX3N1YnNjcmliZVRvQWxsVGFiQ2hhbmdlcygpIHtcbiAgICAvLyBTaW5jZSB3ZSB1c2UgYSBxdWVyeSB3aXRoIGBkZXNjZW5kYW50czogdHJ1ZWAgdG8gcGljayB1cCB0aGUgdGFicywgd2UgbWF5IGVuZCB1cCBjYXRjaGluZ1xuICAgIC8vIHNvbWUgdGhhdCBhcmUgaW5zaWRlIG9mIG5lc3RlZCB0YWIgZ3JvdXBzLiBXZSBmaWx0ZXIgdGhlbSBvdXQgbWFudWFsbHkgYnkgY2hlY2tpbmcgdGhhdFxuICAgIC8vIHRoZSBjbG9zZXN0IGdyb3VwIHRvIHRoZSB0YWIgaXMgdGhlIGN1cnJlbnQgb25lLlxuICAgIHRoaXMuX2FsbFRhYnMuY2hhbmdlcy5waXBlKHN0YXJ0V2l0aCh0aGlzLl9hbGxUYWJzKSkuc3Vic2NyaWJlKCh0YWJzOiBRdWVyeUxpc3Q8TWF0VGFiPikgPT4ge1xuICAgICAgdGhpcy5fdGFicy5yZXNldChcbiAgICAgICAgdGFicy5maWx0ZXIodGFiID0+IHtcbiAgICAgICAgICByZXR1cm4gdGFiLl9jbG9zZXN0VGFiR3JvdXAgPT09IHRoaXMgfHwgIXRhYi5fY2xvc2VzdFRhYkdyb3VwO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgICB0aGlzLl90YWJzLm5vdGlmeU9uQ2hhbmdlcygpO1xuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fdGFicy5kZXN0cm95KCk7XG4gICAgdGhpcy5fdGFic1N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuX3RhYkxhYmVsU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICAvKiogUmUtYWxpZ25zIHRoZSBpbmsgYmFyIHRvIHRoZSBzZWxlY3RlZCB0YWIgZWxlbWVudC4gKi9cbiAgcmVhbGlnbklua0JhcigpIHtcbiAgICBpZiAodGhpcy5fdGFiSGVhZGVyKSB7XG4gICAgICB0aGlzLl90YWJIZWFkZXIuX2FsaWduSW5rQmFyVG9TZWxlY3RlZFRhYigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNhbGN1bGF0ZXMgdGhlIHRhYiBncm91cCdzIHBhZ2luYXRpb24gZGltZW5zaW9ucy5cbiAgICpcbiAgICogV0FSTklORzogQ2FsbGluZyB0aGlzIG1ldGhvZCBjYW4gYmUgdmVyeSBjb3N0bHkgaW4gdGVybXMgb2YgcGVyZm9ybWFuY2UuIEl0IHNob3VsZCBiZSBjYWxsZWRcbiAgICogYXMgaW5mcmVxdWVudGx5IGFzIHBvc3NpYmxlIGZyb20gb3V0c2lkZSBvZiB0aGUgVGFicyBjb21wb25lbnQgYXMgaXQgY2F1c2VzIGEgcmVmbG93IG9mIHRoZVxuICAgKiBwYWdlLlxuICAgKi9cbiAgdXBkYXRlUGFnaW5hdGlvbigpIHtcbiAgICBpZiAodGhpcy5fdGFiSGVhZGVyKSB7XG4gICAgICB0aGlzLl90YWJIZWFkZXIudXBkYXRlUGFnaW5hdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGZvY3VzIHRvIGEgcGFydGljdWxhciB0YWIuXG4gICAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgdGFiIHRvIGJlIGZvY3VzZWQuXG4gICAqL1xuICBmb2N1c1RhYihpbmRleDogbnVtYmVyKSB7XG4gICAgY29uc3QgaGVhZGVyID0gdGhpcy5fdGFiSGVhZGVyO1xuXG4gICAgaWYgKGhlYWRlcikge1xuICAgICAgaGVhZGVyLmZvY3VzSW5kZXggPSBpbmRleDtcbiAgICB9XG4gIH1cblxuICBfZm9jdXNDaGFuZ2VkKGluZGV4OiBudW1iZXIpIHtcbiAgICB0aGlzLl9sYXN0Rm9jdXNlZFRhYkluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5mb2N1c0NoYW5nZS5lbWl0KHRoaXMuX2NyZWF0ZUNoYW5nZUV2ZW50KGluZGV4KSk7XG4gIH1cblxuICBwcml2YXRlIF9jcmVhdGVDaGFuZ2VFdmVudChpbmRleDogbnVtYmVyKTogTWF0VGFiQ2hhbmdlRXZlbnQge1xuICAgIGNvbnN0IGV2ZW50ID0gbmV3IE1hdFRhYkNoYW5nZUV2ZW50KCk7XG4gICAgZXZlbnQuaW5kZXggPSBpbmRleDtcbiAgICBpZiAodGhpcy5fdGFicyAmJiB0aGlzLl90YWJzLmxlbmd0aCkge1xuICAgICAgZXZlbnQudGFiID0gdGhpcy5fdGFicy50b0FycmF5KClbaW5kZXhdO1xuICAgIH1cbiAgICByZXR1cm4gZXZlbnQ7XG4gIH1cblxuICAvKipcbiAgICogU3Vic2NyaWJlcyB0byBjaGFuZ2VzIGluIHRoZSB0YWIgbGFiZWxzLiBUaGlzIGlzIG5lZWRlZCwgYmVjYXVzZSB0aGUgQElucHV0IGZvciB0aGUgbGFiZWwgaXNcbiAgICogb24gdGhlIE1hdFRhYiBjb21wb25lbnQsIHdoZXJlYXMgdGhlIGRhdGEgYmluZGluZyBpcyBpbnNpZGUgdGhlIE1hdFRhYkdyb3VwLiBJbiBvcmRlciBmb3IgdGhlXG4gICAqIGJpbmRpbmcgdG8gYmUgdXBkYXRlZCwgd2UgbmVlZCB0byBzdWJzY3JpYmUgdG8gY2hhbmdlcyBpbiBpdCBhbmQgdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uXG4gICAqIG1hbnVhbGx5LlxuICAgKi9cbiAgcHJpdmF0ZSBfc3Vic2NyaWJlVG9UYWJMYWJlbHMoKSB7XG4gICAgaWYgKHRoaXMuX3RhYkxhYmVsU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLl90YWJMYWJlbFN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIH1cblxuICAgIHRoaXMuX3RhYkxhYmVsU3Vic2NyaXB0aW9uID0gbWVyZ2UoLi4udGhpcy5fdGFicy5tYXAodGFiID0+IHRhYi5fc3RhdGVDaGFuZ2VzKSkuc3Vic2NyaWJlKCgpID0+XG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKSxcbiAgICApO1xuICB9XG5cbiAgLyoqIENsYW1wcyB0aGUgZ2l2ZW4gaW5kZXggdG8gdGhlIGJvdW5kcyBvZiAwIGFuZCB0aGUgdGFicyBsZW5ndGguICovXG4gIHByaXZhdGUgX2NsYW1wVGFiSW5kZXgoaW5kZXg6IG51bWJlciB8IG51bGwpOiBudW1iZXIge1xuICAgIC8vIE5vdGUgdGhlIGB8fCAwYCwgd2hpY2ggZW5zdXJlcyB0aGF0IHZhbHVlcyBsaWtlIE5hTiBjYW4ndCBnZXQgdGhyb3VnaFxuICAgIC8vIGFuZCB3aGljaCB3b3VsZCBvdGhlcndpc2UgdGhyb3cgdGhlIGNvbXBvbmVudCBpbnRvIGFuIGluZmluaXRlIGxvb3BcbiAgICAvLyAoc2luY2UgTWF0aC5tYXgoTmFOLCAwKSA9PT0gTmFOKS5cbiAgICByZXR1cm4gTWF0aC5taW4odGhpcy5fdGFicy5sZW5ndGggLSAxLCBNYXRoLm1heChpbmRleCB8fCAwLCAwKSk7XG4gIH1cblxuICAvKiogUmV0dXJucyBhIHVuaXF1ZSBpZCBmb3IgZWFjaCB0YWIgbGFiZWwgZWxlbWVudCAqL1xuICBfZ2V0VGFiTGFiZWxJZChpOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiBgbWF0LXRhYi1sYWJlbC0ke3RoaXMuX2dyb3VwSWR9LSR7aX1gO1xuICB9XG5cbiAgLyoqIFJldHVybnMgYSB1bmlxdWUgaWQgZm9yIGVhY2ggdGFiIGNvbnRlbnQgZWxlbWVudCAqL1xuICBfZ2V0VGFiQ29udGVudElkKGk6IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBtYXQtdGFiLWNvbnRlbnQtJHt0aGlzLl9ncm91cElkfS0ke2l9YDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBoZWlnaHQgb2YgdGhlIGJvZHkgd3JhcHBlciB0byB0aGUgaGVpZ2h0IG9mIHRoZSBhY3RpdmF0aW5nIHRhYiBpZiBkeW5hbWljXG4gICAqIGhlaWdodCBwcm9wZXJ0eSBpcyB0cnVlLlxuICAgKi9cbiAgX3NldFRhYkJvZHlXcmFwcGVySGVpZ2h0KHRhYkhlaWdodDogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9keW5hbWljSGVpZ2h0IHx8ICF0aGlzLl90YWJCb2R5V3JhcHBlckhlaWdodCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHdyYXBwZXI6IEhUTUxFbGVtZW50ID0gdGhpcy5fdGFiQm9keVdyYXBwZXIubmF0aXZlRWxlbWVudDtcblxuICAgIHdyYXBwZXIuc3R5bGUuaGVpZ2h0ID0gdGhpcy5fdGFiQm9keVdyYXBwZXJIZWlnaHQgKyAncHgnO1xuXG4gICAgLy8gVGhpcyBjb25kaXRpb25hbCBmb3JjZXMgdGhlIGJyb3dzZXIgdG8gcGFpbnQgdGhlIGhlaWdodCBzbyB0aGF0XG4gICAgLy8gdGhlIGFuaW1hdGlvbiB0byB0aGUgbmV3IGhlaWdodCBjYW4gaGF2ZSBhbiBvcmlnaW4uXG4gICAgaWYgKHRoaXMuX3RhYkJvZHlXcmFwcGVyLm5hdGl2ZUVsZW1lbnQub2Zmc2V0SGVpZ2h0KSB7XG4gICAgICB3cmFwcGVyLnN0eWxlLmhlaWdodCA9IHRhYkhlaWdodCArICdweCc7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlbW92ZXMgdGhlIGhlaWdodCBvZiB0aGUgdGFiIGJvZHkgd3JhcHBlci4gKi9cbiAgX3JlbW92ZVRhYkJvZHlXcmFwcGVySGVpZ2h0KCk6IHZvaWQge1xuICAgIGNvbnN0IHdyYXBwZXIgPSB0aGlzLl90YWJCb2R5V3JhcHBlci5uYXRpdmVFbGVtZW50O1xuICAgIHRoaXMuX3RhYkJvZHlXcmFwcGVySGVpZ2h0ID0gd3JhcHBlci5jbGllbnRIZWlnaHQ7XG4gICAgd3JhcHBlci5zdHlsZS5oZWlnaHQgPSAnJztcbiAgICB0aGlzLmFuaW1hdGlvbkRvbmUuZW1pdCgpO1xuICB9XG5cbiAgLyoqIEhhbmRsZSBjbGljayBldmVudHMsIHNldHRpbmcgbmV3IHNlbGVjdGVkIGluZGV4IGlmIGFwcHJvcHJpYXRlLiAqL1xuICBfaGFuZGxlQ2xpY2sodGFiOiBNYXRUYWIsIHRhYkhlYWRlcjogTWF0VGFiR3JvdXBCYXNlSGVhZGVyLCBpbmRleDogbnVtYmVyKSB7XG4gICAgaWYgKCF0YWIuZGlzYWJsZWQpIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IHRhYkhlYWRlci5mb2N1c0luZGV4ID0gaW5kZXg7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJldHJpZXZlcyB0aGUgdGFiaW5kZXggZm9yIHRoZSB0YWIuICovXG4gIF9nZXRUYWJJbmRleCh0YWI6IE1hdFRhYiwgaW5kZXg6IG51bWJlcik6IG51bWJlciB8IG51bGwge1xuICAgIGlmICh0YWIuZGlzYWJsZWQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCB0YXJnZXRJbmRleCA9IHRoaXMuX2xhc3RGb2N1c2VkVGFiSW5kZXggPz8gdGhpcy5zZWxlY3RlZEluZGV4O1xuICAgIHJldHVybiBpbmRleCA9PT0gdGFyZ2V0SW5kZXggPyAwIDogLTE7XG4gIH1cblxuICAvKiogQ2FsbGJhY2sgZm9yIHdoZW4gdGhlIGZvY3VzZWQgc3RhdGUgb2YgYSB0YWIgaGFzIGNoYW5nZWQuICovXG4gIF90YWJGb2N1c0NoYW5nZWQoZm9jdXNPcmlnaW46IEZvY3VzT3JpZ2luLCBpbmRleDogbnVtYmVyKSB7XG4gICAgLy8gTW91c2UvdG91Y2ggZm9jdXMgaGFwcGVucyBkdXJpbmcgdGhlIGBtb3VzZWRvd25gL2B0b3VjaHN0YXJ0YCBwaGFzZSB3aGljaFxuICAgIC8vIGNhbiBjYXVzZSB0aGUgdGFiIHRvIGJlIG1vdmVkIG91dCBmcm9tIHVuZGVyIHRoZSBwb2ludGVyLCBpbnRlcnJ1cHRpbmcgdGhlXG4gICAgLy8gY2xpY2sgc2VxdWVuY2UgKHNlZSAjMjE4OTgpLiBXZSBkb24ndCBuZWVkIHRvIHNjcm9sbCB0aGUgdGFiIGludG8gdmlldyBmb3JcbiAgICAvLyBzdWNoIGNhc2VzIGFueXdheSwgYmVjYXVzZSBpdCB3aWxsIGJlIGRvbmUgd2hlbiB0aGUgdGFiIGJlY29tZXMgc2VsZWN0ZWQuXG4gICAgaWYgKGZvY3VzT3JpZ2luICYmIGZvY3VzT3JpZ2luICE9PSAnbW91c2UnICYmIGZvY3VzT3JpZ2luICE9PSAndG91Y2gnKSB7XG4gICAgICB0aGlzLl90YWJIZWFkZXIuZm9jdXNJbmRleCA9IGluZGV4O1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1hdGVyaWFsIGRlc2lnbiB0YWItZ3JvdXAgY29tcG9uZW50LiBTdXBwb3J0cyBiYXNpYyB0YWIgcGFpcnMgKGxhYmVsICsgY29udGVudCkgYW5kIGluY2x1ZGVzXG4gKiBhbmltYXRlZCBpbmstYmFyLCBrZXlib2FyZCBuYXZpZ2F0aW9uLCBhbmQgc2NyZWVuIHJlYWRlci5cbiAqIFNlZTogaHR0cHM6Ly9tYXRlcmlhbC5pby9kZXNpZ24vY29tcG9uZW50cy90YWJzLmh0bWxcbiAqL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnbWF0LXRhYi1ncm91cCcsXG4gIGV4cG9ydEFzOiAnbWF0VGFiR3JvdXAnLFxuICB0ZW1wbGF0ZVVybDogJ3RhYi1ncm91cC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJ3RhYi1ncm91cC5jc3MnXSxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnZhbGlkYXRlLWRlY29yYXRvcnNcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5EZWZhdWx0LFxuICBpbnB1dHM6IFsnY29sb3InLCAnZGlzYWJsZVJpcHBsZSddLFxuICBwcm92aWRlcnM6IFtcbiAgICB7XG4gICAgICBwcm92aWRlOiBNQVRfVEFCX0dST1VQLFxuICAgICAgdXNlRXhpc3Rpbmc6IE1hdFRhYkdyb3VwLFxuICAgIH0sXG4gIF0sXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnbWF0LW1kYy10YWItZ3JvdXAnLFxuICAgICdbY2xhc3MubWF0LW1kYy10YWItZ3JvdXAtZHluYW1pYy1oZWlnaHRdJzogJ2R5bmFtaWNIZWlnaHQnLFxuICAgICdbY2xhc3MubWF0LW1kYy10YWItZ3JvdXAtaW52ZXJ0ZWQtaGVhZGVyXSc6ICdoZWFkZXJQb3NpdGlvbiA9PT0gXCJiZWxvd1wiJyxcbiAgICAnW2NsYXNzLm1hdC1tZGMtdGFiLWdyb3VwLXN0cmV0Y2gtdGFic10nOiAnc3RyZXRjaFRhYnMnLFxuICB9LFxufSlcbmV4cG9ydCBjbGFzcyBNYXRUYWJHcm91cCBleHRlbmRzIF9NYXRUYWJHcm91cEJhc2Uge1xuICBAQ29udGVudENoaWxkcmVuKE1hdFRhYiwge2Rlc2NlbmRhbnRzOiB0cnVlfSkgX2FsbFRhYnM6IFF1ZXJ5TGlzdDxNYXRUYWI+O1xuICBAVmlld0NoaWxkKCd0YWJCb2R5V3JhcHBlcicpIF90YWJCb2R5V3JhcHBlcjogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZCgndGFiSGVhZGVyJykgX3RhYkhlYWRlcjogTWF0VGFiSGVhZGVyO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBpbmsgYmFyIHNob3VsZCBmaXQgaXRzIHdpZHRoIHRvIHRoZSBzaXplIG9mIHRoZSB0YWIgbGFiZWwgY29udGVudC4gKi9cbiAgQElucHV0KClcbiAgZ2V0IGZpdElua0JhclRvQ29udGVudCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fZml0SW5rQmFyVG9Db250ZW50O1xuICB9XG4gIHNldCBmaXRJbmtCYXJUb0NvbnRlbnQodjogQm9vbGVhbklucHV0KSB7XG4gICAgdGhpcy5fZml0SW5rQmFyVG9Db250ZW50ID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHYpO1xuICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICB9XG4gIHByaXZhdGUgX2ZpdElua0JhclRvQ29udGVudCA9IGZhbHNlO1xuXG4gIC8qKiBXaGV0aGVyIHRhYnMgc2hvdWxkIGJlIHN0cmV0Y2hlZCB0byBmaWxsIHRoZSBoZWFkZXIuICovXG4gIEBJbnB1dCgnbWF0LXN0cmV0Y2gtdGFicycpXG4gIGdldCBzdHJldGNoVGFicygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fc3RyZXRjaFRhYnM7XG4gIH1cbiAgc2V0IHN0cmV0Y2hUYWJzKHY6IEJvb2xlYW5JbnB1dCkge1xuICAgIHRoaXMuX3N0cmV0Y2hUYWJzID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHYpO1xuICB9XG4gIHByaXZhdGUgX3N0cmV0Y2hUYWJzID0gdHJ1ZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBlbGVtZW50UmVmOiBFbGVtZW50UmVmLFxuICAgIGNoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBASW5qZWN0KE1BVF9UQUJTX0NPTkZJRykgQE9wdGlvbmFsKCkgZGVmYXVsdENvbmZpZz86IE1hdFRhYnNDb25maWcsXG4gICAgQE9wdGlvbmFsKCkgQEluamVjdChBTklNQVRJT05fTU9EVUxFX1RZUEUpIGFuaW1hdGlvbk1vZGU/OiBzdHJpbmcsXG4gICkge1xuICAgIHN1cGVyKGVsZW1lbnRSZWYsIGNoYW5nZURldGVjdG9yUmVmLCBkZWZhdWx0Q29uZmlnLCBhbmltYXRpb25Nb2RlKTtcbiAgICB0aGlzLmZpdElua0JhclRvQ29udGVudCA9XG4gICAgICBkZWZhdWx0Q29uZmlnICYmIGRlZmF1bHRDb25maWcuZml0SW5rQmFyVG9Db250ZW50ICE9IG51bGxcbiAgICAgICAgPyBkZWZhdWx0Q29uZmlnLmZpdElua0JhclRvQ29udGVudFxuICAgICAgICA6IGZhbHNlO1xuICB9XG59XG5cbi8qKiBBIHNpbXBsZSBjaGFuZ2UgZXZlbnQgZW1pdHRlZCBvbiBmb2N1cyBvciBzZWxlY3Rpb24gY2hhbmdlcy4gKi9cbmV4cG9ydCBjbGFzcyBNYXRUYWJDaGFuZ2VFdmVudCB7XG4gIC8qKiBJbmRleCBvZiB0aGUgY3VycmVudGx5LXNlbGVjdGVkIHRhYi4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgLyoqIFJlZmVyZW5jZSB0byB0aGUgY3VycmVudGx5LXNlbGVjdGVkIHRhYi4gKi9cbiAgdGFiOiBNYXRUYWI7XG59XG4iLCI8bWF0LXRhYi1oZWFkZXIgI3RhYkhlYWRlclxuICAgICAgICAgICAgICAgIFtzZWxlY3RlZEluZGV4XT1cInNlbGVjdGVkSW5kZXggfHwgMFwiXG4gICAgICAgICAgICAgICAgW2Rpc2FibGVSaXBwbGVdPVwiZGlzYWJsZVJpcHBsZVwiXG4gICAgICAgICAgICAgICAgKGluZGV4Rm9jdXNlZCk9XCJfZm9jdXNDaGFuZ2VkKCRldmVudClcIlxuICAgICAgICAgICAgICAgIChzZWxlY3RGb2N1c2VkSW5kZXgpPVwic2VsZWN0ZWRJbmRleCA9ICRldmVudFwiPlxuXG4gIDxkaXYgY2xhc3M9XCJtZGMtdGFiIG1hdC1tZGMtdGFiIG1hdC1tZGMtZm9jdXMtaW5kaWNhdG9yXCJcbiAgICAgICAjdGFiTm9kZVxuICAgICAgIHJvbGU9XCJ0YWJcIlxuICAgICAgIG1hdFRhYkxhYmVsV3JhcHBlclxuICAgICAgIGNka01vbml0b3JFbGVtZW50Rm9jdXNcbiAgICAgICAqbmdGb3I9XCJsZXQgdGFiIG9mIF90YWJzOyBsZXQgaSA9IGluZGV4XCJcbiAgICAgICBbaWRdPVwiX2dldFRhYkxhYmVsSWQoaSlcIlxuICAgICAgIFthdHRyLnRhYkluZGV4XT1cIl9nZXRUYWJJbmRleCh0YWIsIGkpXCJcbiAgICAgICBbYXR0ci5hcmlhLXBvc2luc2V0XT1cImkgKyAxXCJcbiAgICAgICBbYXR0ci5hcmlhLXNldHNpemVdPVwiX3RhYnMubGVuZ3RoXCJcbiAgICAgICBbYXR0ci5hcmlhLWNvbnRyb2xzXT1cIl9nZXRUYWJDb250ZW50SWQoaSlcIlxuICAgICAgIFthdHRyLmFyaWEtc2VsZWN0ZWRdPVwic2VsZWN0ZWRJbmRleCA9PT0gaVwiXG4gICAgICAgW2F0dHIuYXJpYS1sYWJlbF09XCJ0YWIuYXJpYUxhYmVsIHx8IG51bGxcIlxuICAgICAgIFthdHRyLmFyaWEtbGFiZWxsZWRieV09XCIoIXRhYi5hcmlhTGFiZWwgJiYgdGFiLmFyaWFMYWJlbGxlZGJ5KSA/IHRhYi5hcmlhTGFiZWxsZWRieSA6IG51bGxcIlxuICAgICAgIFtjbGFzcy5tZGMtdGFiLS1hY3RpdmVdPVwic2VsZWN0ZWRJbmRleCA9PT0gaVwiXG4gICAgICAgW25nQ2xhc3NdPVwidGFiLmxhYmVsQ2xhc3NcIlxuICAgICAgIFtkaXNhYmxlZF09XCJ0YWIuZGlzYWJsZWRcIlxuICAgICAgIFtmaXRJbmtCYXJUb0NvbnRlbnRdPVwiZml0SW5rQmFyVG9Db250ZW50XCJcbiAgICAgICAoY2xpY2spPVwiX2hhbmRsZUNsaWNrKHRhYiwgdGFiSGVhZGVyLCBpKVwiXG4gICAgICAgKGNka0ZvY3VzQ2hhbmdlKT1cIl90YWJGb2N1c0NoYW5nZWQoJGV2ZW50LCBpKVwiPlxuICAgIDxzcGFuIGNsYXNzPVwibWRjLXRhYl9fcmlwcGxlXCI+PC9zcGFuPlxuXG4gICAgPCEtLSBOZWVkcyB0byBiZSBhIHNlcGFyYXRlIGVsZW1lbnQsIGJlY2F1c2Ugd2UgY2FuJ3QgcHV0XG4gICAgICAgICBgb3ZlcmZsb3c6IGhpZGRlbmAgb24gdGFiIGR1ZSB0byB0aGUgaW5rIGJhci4gLS0+XG4gICAgPGRpdlxuICAgICAgY2xhc3M9XCJtYXQtbWRjLXRhYi1yaXBwbGVcIlxuICAgICAgbWF0LXJpcHBsZVxuICAgICAgW21hdFJpcHBsZVRyaWdnZXJdPVwidGFiTm9kZVwiXG4gICAgICBbbWF0UmlwcGxlRGlzYWJsZWRdPVwidGFiLmRpc2FibGVkIHx8IGRpc2FibGVSaXBwbGVcIj48L2Rpdj5cblxuICAgIDxzcGFuIGNsYXNzPVwibWRjLXRhYl9fY29udGVudFwiPlxuICAgICAgPHNwYW4gY2xhc3M9XCJtZGMtdGFiX190ZXh0LWxhYmVsXCI+XG4gICAgICAgIDwhLS0gSWYgdGhlcmUgaXMgYSBsYWJlbCB0ZW1wbGF0ZSwgdXNlIGl0LiAtLT5cbiAgICAgICAgPG5nLXRlbXBsYXRlIFtuZ0lmXT1cInRhYi50ZW1wbGF0ZUxhYmVsXCIgW25nSWZFbHNlXT1cInRhYlRleHRMYWJlbFwiPlxuICAgICAgICAgIDxuZy10ZW1wbGF0ZSBbY2RrUG9ydGFsT3V0bGV0XT1cInRhYi50ZW1wbGF0ZUxhYmVsXCI+PC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgPC9uZy10ZW1wbGF0ZT5cblxuICAgICAgICA8IS0tIElmIHRoZXJlIGlzIG5vdCBhIGxhYmVsIHRlbXBsYXRlLCBmYWxsIGJhY2sgdG8gdGhlIHRleHQgbGFiZWwuIC0tPlxuICAgICAgICA8bmctdGVtcGxhdGUgI3RhYlRleHRMYWJlbD57e3RhYi50ZXh0TGFiZWx9fTwvbmctdGVtcGxhdGU+XG4gICAgICA8L3NwYW4+XG4gICAgPC9zcGFuPlxuICA8L2Rpdj5cbjwvbWF0LXRhYi1oZWFkZXI+XG5cbjxkaXZcbiAgY2xhc3M9XCJtYXQtbWRjLXRhYi1ib2R5LXdyYXBwZXJcIlxuICBbY2xhc3MuX21hdC1hbmltYXRpb24tbm9vcGFibGVdPVwiX2FuaW1hdGlvbk1vZGUgPT09ICdOb29wQW5pbWF0aW9ucydcIlxuICAjdGFiQm9keVdyYXBwZXI+XG4gIDxtYXQtdGFiLWJvZHkgcm9sZT1cInRhYnBhbmVsXCJcbiAgICAgICAgICAgICAgICpuZ0Zvcj1cImxldCB0YWIgb2YgX3RhYnM7IGxldCBpID0gaW5kZXhcIlxuICAgICAgICAgICAgICAgW2lkXT1cIl9nZXRUYWJDb250ZW50SWQoaSlcIlxuICAgICAgICAgICAgICAgW2F0dHIudGFiaW5kZXhdPVwiKGNvbnRlbnRUYWJJbmRleCAhPSBudWxsICYmIHNlbGVjdGVkSW5kZXggPT09IGkpID8gY29udGVudFRhYkluZGV4IDogbnVsbFwiXG4gICAgICAgICAgICAgICBbYXR0ci5hcmlhLWxhYmVsbGVkYnldPVwiX2dldFRhYkxhYmVsSWQoaSlcIlxuICAgICAgICAgICAgICAgW2NsYXNzLm1hdC1tZGMtdGFiLWJvZHktYWN0aXZlXT1cInNlbGVjdGVkSW5kZXggPT09IGlcIlxuICAgICAgICAgICAgICAgW25nQ2xhc3NdPVwidGFiLmJvZHlDbGFzc1wiXG4gICAgICAgICAgICAgICBbY29udGVudF09XCJ0YWIuY29udGVudCFcIlxuICAgICAgICAgICAgICAgW3Bvc2l0aW9uXT1cInRhYi5wb3NpdGlvbiFcIlxuICAgICAgICAgICAgICAgW29yaWdpbl09XCJ0YWIub3JpZ2luXCJcbiAgICAgICAgICAgICAgIFthbmltYXRpb25EdXJhdGlvbl09XCJhbmltYXRpb25EdXJhdGlvblwiXG4gICAgICAgICAgICAgICBbcHJlc2VydmVDb250ZW50XT1cInByZXNlcnZlQ29udGVudFwiXG4gICAgICAgICAgICAgICAoX29uQ2VudGVyZWQpPVwiX3JlbW92ZVRhYkJvZHlXcmFwcGVySGVpZ2h0KClcIlxuICAgICAgICAgICAgICAgKF9vbkNlbnRlcmluZyk9XCJfc2V0VGFiQm9keVdyYXBwZXJIZWlnaHQoJGV2ZW50KVwiPlxuICA8L21hdC10YWItYm9keT5cbjwvZGl2PlxuIl19