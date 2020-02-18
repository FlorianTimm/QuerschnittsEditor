dist/index.html: src/* docs/manual/QuerschnittsEditor.pdf dist/jsp/proxy.jsp dist/jsp/proxy_er.jsp dist/jsp/login.jsp dist/jsp/abschnittWFS.jsp dist/img/ajax-loader.gif dist/img/arrow.png dist/img/arrow_klein.png
	npm run build

clean:
	rm -r dist
	mkdir dist
	mkdir -p dist/jsp
	mkdir -p dist/img

docs/manual/QuerschnittsEditor.pdf: docs/manual/QuerschnittsEditor.tex
	cd docs/manual && pdflatex QuerschnittsEditor
	#cd docs/manual && bibtex QuerschnittsEditor
	cd docs/manual && makeglossaries QuerschnittsEditor
	cd docs/manual && pdflatex QuerschnittsEditor
	cd docs/manual && pdflatex QuerschnittsEditor

dist/jsp/proxy.jsp: src/jsp/proxy.jsp
	mkdir -p dist/jsp
	cp src/jsp/proxy.jsp dist/jsp/proxy.jsp

dist/jsp/proxy_er.jsp: src/jsp/proxy_er.jsp
	mkdir -p dist/jsp
	cp src/jsp/proxy_er.jsp dist/jsp/proxy_er.jsp

dist/jsp/login.jsp: src/jsp/login.jsp
	mkdir -p dist/jsp
	cp src/jsp/login.jsp dist/jsp/login.jsp

dist/jsp/abschnittWFS.jsp: src/jsp/abschnittWFS.jsp
	mkdir -p dist/jsp
	cp src/jsp/abschnittWFS.jsp dist/jsp/abschnittWFS.jsp

dist/img/ajax-loader.gif: src/img/ajax-loader.gif
	mkdir -p dist/img
	cp src/img/ajax-loader.gif dist/img/ajax-loader.gif

dist/img/arrow.png: src/img/arrow.png
	mkdir -p dist/img
	cp src/img/arrow.png dist/img/arrow.png

dist/img/arrow_klein.png: src/img/arrow_klein.png
	mkdir -p dist/img
	cp src/img/arrow_klein.png dist/img/arrow_klein.png