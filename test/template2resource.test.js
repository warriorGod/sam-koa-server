const debug = require('debug')('test:t2r');

describe('template2resource', function(){

    const t2r = require('../template2resource');

    it('should parse empty yml', function(){
        t2r.convert('').should.be.deepEqual({resources:[]});
    });

    it('should parse not empty yml without resources', function(){
        t2r.convert('Test: 5').should.deepEqual({resources:[]});
    });

    it('should convert yaml to resouces', function(){
        let fs = require('fs');
        let fileNames = fs.readdirSync('./test/resources/convert');

        for (let fName of fileNames) {
            fName = fName.toString();
            if (fName.match('\.yaml')) {
                let yamlCnt = fs.readFileSync(`./test/resources/convert/${fName}`);
                let jsonCnt = fs.readFileSync(`./test/resources/convert/${fName.substring(0, fName.length-5)}.json`);

                //debug(yamlCnt.toString(), jsonCnt.toString());
                t2r.convert(yamlCnt.toString()).should.deepEqual(JSON.parse(jsonCnt));
            }
        }
    });
});