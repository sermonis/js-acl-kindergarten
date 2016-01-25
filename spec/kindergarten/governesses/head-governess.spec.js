import { FactoryGirl } from '../../support/factory-girl';

import {
  AccessDenied
} from '../../../lib/kindergarten/errors';

describe('HeadGoverness', function () {
  beforeEach(function () {
    this.child = new FactoryGirl('child');
    this.Tv = new FactoryGirl('Tv');
    this.CableTv = new FactoryGirl('CableTv');

    this.tv = new this.Tv();
    this.cableTv = new this.CableTv();

    this.HeadGoverness = new FactoryGirl('HeadGoverness');
    this.Rule = new FactoryGirl('Rule');

    this.headGoverness = new this.HeadGoverness(
      this.child
    );

    this.rule1 = this.Rule.create(
      'can watch', {
        items: [this.Tv]
      }
    );

    this.rule2 = this.Rule.create(
      'cannot watch', {
        items: [this.CableTv]
      }
    );

    this.headGoverness.addRule(this.rule1, this.rule2);
  });

  describe('constructor', function () {
    it('stores reference to child', function () {
      expect(this.headGoverness.child).toBe(this.child);
    });
  });

  describe('guard', function () {
    it('it allows watch tv', function () {
      expect(this.headGoverness.guard('watch', this.tv)).toBe(this.tv);
    });

    it('it disallows watch cable tv', function () {
      expect(() => {
        this.headGoverness.guard('watch', this.cableTv);
      }).toThrowError('Child is not allowed to watch the target.');

      try {
        this.headGoverness.guard('watch', this.child);
      } catch (e) {
        expect(e instanceof AccessDenied).toBe(true);
      }
    });

    it('it disallows to watch something else', function () {
      expect(() => {
        this.headGoverness.guard('watch', this.child);
      }).toThrowError('Child is not allowed to watch the target.');

      try {
        this.headGoverness.guard('watch', this.child);
      } catch (e) {
        expect(e instanceof AccessDenied).toBe(true);
      }
    });
  });
});