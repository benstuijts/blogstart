module.exports = {
    
    development: {
        name: "Blogstart",
        author: "Ben Stuijts",
        baseUrl: "https://blogstart2016-stuijts.c9users.io/",
        tagline: "This is a great tagline!",
        contact: {
            email: "benstuijts@mentorpower.nl",
            telephone: "0031651363602",
            website: "http://www.mentorpower.nl",
            linkin: "https://nl.linkedin.com/in/benstuijts",
            facebook: "https://www.facebook.com/mentorpower.nl",
            twitter: "https://twitter.com/BenStuijts",
            google: "https://www.google.com/+MentorpowerNl",
            address: "Maltaweide 8, 3223MJ Hellevoetsluis",
            kvk: "63508109",
            iban: "NL48 KNAB 0732 2691 13",
            btw: "NL196390400B01",
            bic: ""
         },
        database: {
            url: "mongodb://188.166.89.80/blogstart"
        },
        administrator: {
            username: 'bens',
            password: '14303963',
            token: 'MB7qOk6NyZBCgZE5PcoO'
        },
        bootstrap: true,
        jquery: true,
        fontawesome: true,
    }, 
    
    production: {
        
    }
    
    
};

function randomString(r){for(var n="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",a=0;r>a;a++)n+=t.charAt(Math.floor(Math.random()*t.length));return n}
