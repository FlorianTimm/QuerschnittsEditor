function get_pos(line, point) {
    posi = []
    sum = 0

    for (var i = 0; i < line.length - 1; i++) {
        l1 = line[i]
        l2 = line[i+1]
        v = v_diff(l2, l1)
        f = (v_skalar(v_diff(point, l1), v))/(v_skalar(v, v))
        y = v_sum(l1, v_multi(v, f))

        lot = v_diff(point, y)
        dist = v_len(lot)

        seite = 'M'
        if (dist > 0.01) {
            c3 = v_kreuz(v_add3(v), v_add3(lot))[2]
            if (c3 > 0) {
                seite = 'R'
            } else if (c3 < 0) {
                seite = 'L'
			}
		}

        r_dist = dist
        drin = 0
        if (f < 0) {
            f = 0
            r_dist = v_len(v_diff(l1, point))
            drin = 1
        } else if (f > 1) {
            f = 1
            r_dist = v_len(v_diff(l2, y))
            drin = 1
		}
        station = sum + f * (v_len(v))

        posi.push([drin, r_dist, station, seite, dist])

        sum += v_len(v)
	}
    return min(posi)
}

function v_add3(v, comp=0) {
    r = v
    r.push(comp)
    return r
}

function v_len(v) {
    r = 0
    for (var i = 0; i < v.length; i++) {
        r += Math.pow(v[i], 2)
	}
    return Math.sqrt(r)
}

function v_lot(v) {
    r = []
    if (v.length != 2) {
		console.log("Nur für 2D Vektoren")
        return null
	}
    return [-v[1], v[0]]
}

function v_diff(v1, v2) {
    r = []
    if (v1.length != v2.length) {
		console.log("Ungleiche Länge")
        return null
	}
    for (var i = 0; i < v1.length; i++) {
        r.push(v1[i] - v2[i])
	}
    return r
}

function v_sum(v1, v2) {
    r = []
    if (v1.length != v2.length) {
        return null // Ungleiche Länge
	}
    for (var i = 0; i < v1.length; i++) {
        r.push(v1[i] + v2[i])
	}
    return r
}

function v_skalar(v1, v2) {
    r = 0
    if (v1.length != v2.length) {
        return null // Ungleiche Länge
	}
    for (var i = 0; i < v1.length; i++) {
        r += v1[i] * v2[i]
	}
    return r
}

function v_kreuz(v1, v2) {
    r = []
    for (var i = 0; i < v1.length; i++) {
        n = i + 1
        nn = i + 2
        if (n >= v1.length) {
            n -= v1.length
		}
        if (nn >= v1.length) {
            nn -= v1.length
		}
        w = v1[n]*v2[nn] - v1[nn]*v2[n]
        r.push(w)
	}
    return r
}


function v_multi(v, z) {
    r = []
    for (var i = 0; i < v.length; i++) {
        r.push(v[i] * z)
	}
    return r
}

function v_einheit(v) {
    return v_multi(v, 1/v_len(v))
}

function l_len(line) {
	len = 0
	//console.log(line)
	for (var i = 1; i < line.length; i++) {
		len += v_len(v_diff(line[i-1],line[i]))
	}
	return len
}