// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * @author Florian Timm, Landesbetrieb Geoinformation und Vermessung, Hamburg
 * @version 2020.01.28
 * @license GPL-3.0-or-later
*/

import Vektor from "../src/ts/Vektor";
import { expect, assert } from 'chai';

describe('Vektor', function () {
    it('len()', function () {
        let len = Vektor.len([3, 4])
        assert.equal(len, 5)
    })

    it('add3()', function () {
        let v1 = [1, 2];
        let v2 = Vektor.add3(v1);
        assert.equal(v2.length, 3, "Länge des neuen Vektors soll 3 sein");
        assert.equal(v1.length, 2, "Länge des alten Vektors soll 2 sein");
        v1[1] = 3;
        expect(v2[1]).to.equal(2, "Kopie des Ursprungvektors")
        assert.equal(v2[2], 0)
    })

    it('lot()', function () {
        let v = Vektor.lot([1, 2]);
        expect(v[0]).eq(-2)
        expect(v[1]).eq(1)
        expect(function () { Vektor.lot([0, 1, 2]) }).to.throw()
    })

    it('diff()', function () {
        expect(Vektor.diff([0, 2], [1, 1])[0]).eq(-1);
        expect(Vektor.diff([0, 2], [1, 1])[1]).eq(1);
        expect(function () { Vektor.diff([0, 2, 1], [1, 1]) }).to.throw()
    })

    it('sum()', function () {
        expect(Vektor.sum([0, 2], [1, 1])[0]).eq(1);
        expect(Vektor.sum([0, 2], [1, 1])[1]).eq(3);
        expect(function () { Vektor.sum([0, 2, 1], [1, 1]) }).to.throw()
    })

    it('einheit()', function () {
        expect(Vektor.einheit([3, 4])[0]).approximately(0.6, 0.000001)
        expect(Vektor.einheit([3, 4])[1]).approximately(0.8, 0.000001);
        expect(Vektor.einheit([0, 0])[0]).eq(0);
    })

    it('skalar()', function () {
        expect(function () { Vektor.skalar([0, 2, 1], [1, 1]) }).to.throw()
    })

    it('kreuz()', function () {
        expect(function () { Vektor.kreuz([0, 2, 1], [1, 1]) }).to.throw()
    })
})