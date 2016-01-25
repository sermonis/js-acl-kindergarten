import { HeadGoverness } from './governesses/head-governess';
import { Perimeter } from './perimeter';
import { Purpose } from './purpose';
import { PubSub } from './utils/pub-sub';
import { AllowedMethodsService } from './utils/allowed-methods-service';
import {
  isString,
  isObject,
  isUndefined,
  isGoverness,
  each,
  find
} from './utils/utils';
import {
  ArgumentError,
  NoPurposeError,
  RestrictedMethodError
} from './errors';

/**
 * The definition of Sandbox class.
 * The sandbox can load multiple perimeters and define a kind of container,
 * where child can play governed by a governess. Sandbox is always under sharp
 * eye of a governess.
 */
export class Sandbox extends PubSub {
  /**
   * Create a new empty sandbox.
   */
  constructor(child) {
    super(); // init publish/subscribe

    this.child = child;

    this.governess = new HeadGoverness(child);

    this._perimeters = [];

    this.trigger('created', arguments);
  }

  /**
   * The getter of a child.
   * Return null if sandbox does not reference any child.
   */
  get child() {
    const child = this._child;

    return isUndefined(child) ?
      null : child;
  }

  /**
   * The setter of a child.
   * Store null instead of undefined.
   */
  set child(value) {
    this._child = isUndefined(value) ?
      null : value;

    return value;
  }

  /**
   * The getter of a governess.
   * Sandbox MUST always reference a governess. If no governess is set, use
   * HeadGoverness.
   * Make sure new governess learn all the rules.
   */
  get governess() {
    return isGoverness(this._governess) ?
      this._governess : (() => {
        // New governess must know all the rules (if any)
        this._learnRules();

        return new HeadGoverness(this.child);
      })();
  }

  /**
   * The setter of the governess.
   * Make sure new governess learn all the rules.
   */
  set governess(value) {
    // if governess is null perimeter will use the governess of it's sandbox
    this._governess = isGoverness(value) ?
      value : new HeadGoverness(this.child);

    // New governess must know all the rules (if any)
    this._learnRules();

    return value;
  }

  /**
   * Make sure governess know all the rules from the loaded perimeters.
   */
  _learnRules() {
    each(this._perimeters || [], (perimeter) => {
      this.governess.learnRules(perimeter);
    });
  }

  /**
   * Load perimeters.
   * Returns the count of addded perimeters.
   */
  loadPerimeter(...perimeters) {
    let counter = 0;

    each(perimeters, (perimeter) => {
      // Sandbox only accepts perimeters
      if (!isObject(perimeter) || !(perimeter instanceof Perimeter)) {
        throw new ArgumentError(
          'Module must be instance of Kindergarten.Perimeter.'
        );
      }

      // Skip if sandbox already contains the perimeter
      if (this.hasPerimeter(perimeter)) return;

      ++counter;

      // If perimeter has a governess, then she has to learn the rules as well
      if (
        isObject(perimeter.governess) &&
        (perimeter.governess instanceof HeadGoverness)
      ) {
        perimeter.governess.learnRules(perimeter, perimeter.govern);
      }

      // The governess of a sandbox must know all the rules
      this.governess.learnRules(perimeter, perimeter.govern);

      perimeter.sandbox = this;

      this._perimeters.push(perimeter);

      this._extendPurpose(perimeter);
    });

    return counter;
  }

  /**
   * Alias for loadPerimeter
   */
  loadModule(...args) {
    return this.loadPerimeter(...args);
  }

  _extendPurpose(perimeter) {
    const name = perimeter.purpose;
    const allowedMethodsService = new AllowedMethodsService(this);

    if (!isString(name)) throw new NoPurposeError();

    if (allowedMethodsService.isRestricted(name)) {
      throw new RestrictedMethodError();
    }

    this[name] = this[name] || new Purpose(name, this);
    this[name]._addPerimeter(perimeter);
  }

  /**
   * Return true if sandbox already contains a perimeter
   */
  hasPerimeter(perimeter) {
    return this._perimeters.some((p) => {
      return p.purpose === perimeter.purpose;
    });
  }

  /**
   * Return perimeter by purpose
   */
  getPerimeter(purpose) {
    const perimeter = find(this._perimeters, (p) => {
      return (p.purpose === purpose);
    });

    return isObject(perimeter) && perimeter instanceof Perimeter ?
      perimeter : null;
  }

  /**
   * Return true if allowed to do action on target
   */
  isAllowed(...args) {
    return this.governess.isAllowed(...args);
  }

  /**
   * Return true if not allowed to do action on target
   */
  isNotAllowed(...args) {
    return !this.isAllowed(...args);
  }
}